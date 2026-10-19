# PostHog error tracking report

> ⚠️ **Needs your attention**
> - Install the project-local `@posthog/cli@latest` from the monorepo workspace root with the workspace's actual package manager before deployment.
> - Configure the image builder to provide `POSTHOG_CLI_API_KEY` as a BuildKit secret, and pass `POSTHOG_CLI_PROJECT_ID` and `POSTHOG_CLI_HOST` as build arguments.
> - Pass a non-empty immutable `POSTHOG_RELEASE_VERSION` (preferably the deployment commit SHA) on every production image build.
> - Configure the production container with the runtime variables `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST`.
> - The project contains no CI-provider or deploy configuration, so the outer provider settings and deployment start configuration still need to be added outside this directory.

## What you still need to do

1. Create a personal API key with the **Source map upload** preset at [https://eu.posthog.com/settings/user-api-keys](https://eu.posthog.com/settings/user-api-keys). The local upload credentials are already configured, but the image-building environment still needs access to the API key.
2. In the settings for the system that builds the Docker image, add `POSTHOG_CLI_API_KEY` as a secret and pass it to the BuildKit build as secret id `POSTHOG_CLI_API_KEY`. Add `POSTHOG_CLI_PROJECT_ID` and `POSTHOG_CLI_HOST` as non-secret build arguments with those exact names. Set the project ID to `309301` and the host to the EU PostHog host.
3. Pass a non-empty immutable `POSTHOG_RELEASE_VERSION` build argument on every production image build, preferably the deployment's commit SHA. The existing release name is `api-gateway`.
4. Install the project-local `@posthog/cli@latest` from the monorepo workspace root using the workspace's actual package manager. The package-manager attempt from this project directory could not resolve the workspace dependency.
5. In the deployment platform's runtime environment (or equivalent `docker run -e` settings), provide `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` so the application can initialize PostHog in the production container. These are runtime SDK settings, not the source-map upload API key.
6. Because no CI provider, compose file, service unit, or deploy script exists in this project, configure the provider-specific BuildKit secret/build arguments and runtime environment in the external deployment system. The Dockerfile expects a monorepo-root build context.

## What error tracking does now

Uncaught exceptions and unhandled promise rejections are captured by the initialized Node PostHog client through `enableExceptionAutocapture: true` in `src/posthog.service.ts`. Exceptions handled by Nest also reach PostHog through `captureException()` in `src/posthog-exception.filter.ts`; the filter is registered globally in `src/app.module.ts`. The existing singleton client is initialized from environment-backed configuration, and the app loads `.env` through the global Nest `ConfigModule`.

The project already had PostHog initialization, and this workflow preserved it rather than adding a second client or duplicate process-level handlers. The first captured exception will appear at [https://eu.posthog.com/project/309301/error_tracking](https://eu.posthog.com/project/309301/error_tracking).

## Source maps and production builds

Source-map upload is wired in `Dockerfile`. The Docker build runs the existing production command from `package.json`:

```text
nest build && posthog-cli --dotenv-file .env sourcemap process --directory ./dist --release-name api-gateway --release-version "$POSTHOG_RELEASE_VERSION"
```

The relevant changed file is:

- `Dockerfile`

The TypeScript source-map settings were already present in `tsconfig.json`, and the build script was already present in `package.json`. Every production image build is set up to upload source maps once the project-local CLI is installed and the required `POSTHOG_CLI_*` values are present in the environment/build inputs where the build runs. The runtime image does not receive the upload API key.

Uploaded symbol sets can be checked at [https://eu.posthog.com/project/309301/error_tracking/configuration](https://eu.posthog.com/project/309301/error_tracking/configuration).

## Verification

Trigger an error in the running application and inspect [PostHog Error Tracking](https://eu.posthog.com/project/309301/error_tracking). After the production image build is configured as above, verify that the exception has readable, symbolicated stack frames and that its source map appears in the Error Tracking configuration page.

This setup does not add release-ID injection at application startup. The deployment system should still pass `POSTHOG_RELEASE_VERSION` during the image build so uploaded source maps use the same immutable release version as the production artifact.
