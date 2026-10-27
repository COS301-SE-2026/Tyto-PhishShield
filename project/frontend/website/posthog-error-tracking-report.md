# PostHog error tracking report

> ⚠️ **Needs your attention**
> - Provide `POSTHOG_API_KEY` to the production Docker build as a BuildKit secret named `POSTHOG_API_KEY`.
> - Pass `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`, `VITE_POSTHOG_PROJECT_TOKEN`, and `VITE_POSTHOG_HOST` as Docker build arguments wherever the image is built.
> - Ensure the repository-root workspace lockfile records `@posthog/rollup-plugin` before using a frozen Docker install.
> - Use a clean install that completes the nested PostHog CLI postinstall so source-map uploads can run.
> - Advance the `package.json` version when producing a distinct versioned release.

## What you still need to do

1. The personal API key is configured locally in `.env` as `POSTHOG_API_KEY`. In the environment that builds the production image, store that same credential in the CI/provider secret store under exactly `POSTHOG_API_KEY`.
2. Build the production image with BuildKit secret forwarding, for example by supplying `--secret id=POSTHOG_API_KEY,env=POSTHOG_API_KEY`. Also pass the non-secret build arguments `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`, `VITE_POSTHOG_PROJECT_TOKEN`, and `VITE_POSTHOG_HOST` from the CI/provider build settings.
3. Make sure the repository-root `pnpm-lock.yaml` records `@posthog/rollup-plugin`, and run a clean dependency install with install scripts enabled so the nested PostHog CLI binary is available. The build command succeeds and uploads only once the uploader credentials and CLI installation are available where the build runs.
4. Increase the `package.json` version for each distinct production release; the uploader uses the package name and version to associate uploaded symbol sets with that release.

## What is now covered

Uncaught browser errors and unhandled promise rejections are captured by the existing PostHog initialization in `src/lib/posthog.ts` through `capture_exceptions`. React render and lifecycle errors are captured by the centralized error boundary in `src/main.tsx`, which calls `posthog.captureException(error)`. The app was already initialized with `posthog-js`, so this project now has PostHog error capture without adding duplicate global listeners or per-component boundaries.

Source-map upload is wired in `vite.config.ts` using `@posthog/rollup-plugin`; dependency/configuration changes are recorded in `package.json` and `package-lock.json`. The production build command is `npm run build` (the Docker production build invokes `pnpm run build`). Production builds are configured to generate hidden source maps, upload them, and delete them after upload when the required `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_HOST` values are available. The Docker build supplies those values through its documented secret/build-argument contract in `Dockerfile`. Uploads start once those values are present in the build environment and the PostHog CLI installation completes successfully.

The uploader also receives the package manifest name and version from `vite.config.ts`, providing release association for uploaded symbol sets. No deploy pipeline inside this project resolves a runtime `POSTHOG_RELEASE_ID`, and no deploy path could be traced that starts the app with one. If runtime release linking is required, the production deploy must resolve a release ID and inject `POSTHOG_RELEASE_ID` into the app's startup environment, while leaving local runs, tests, and pull-request builds unchanged.

## Verify in PostHog

Trigger an error, then inspect [Error Tracking](https://eu.posthog.com/project/309301/error_tracking). Uploaded symbol sets appear at [Error Tracking configuration](https://eu.posthog.com/project/309301/error_tracking/configuration). After a successful production build and deploy, confirm that the exception is readable and associated with the package release name/version used by the uploader. If runtime release linking is added, also verify that the exception's `$release_id` matches the ID resolved by the deploy.
