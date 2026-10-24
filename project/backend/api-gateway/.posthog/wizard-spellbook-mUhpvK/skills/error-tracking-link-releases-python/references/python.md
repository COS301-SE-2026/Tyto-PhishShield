> AI agents: this is one page from PostHog's docs. Full index of Markdown docs for LLMs: https://posthog.com/llms.txt

# Link releases for Python

Python apps run their source code directly, so there are no source maps to upload. Stack traces already show the right files and lines.

To link each exception to the [release](/docs/error-tracking/releases.md) that produced it, create the release when you deploy and give its ID to your app. The [Python SDK](/docs/error-tracking/installation/python.md) reads the ID from the `POSTHOG_RELEASE_ID` environment variable and sends it as `$release_id` on every event.

1.  1

    ## Update the SDK

    Required

    Install [posthog-python 7.59.0](https://github.com/PostHog/posthog-python/releases/tag/posthog-v7.59.0) or later:

    Terminal

    ```bash
    pip install --upgrade "posthog>=7.59.0"
    ```

2.  2

    ## Resolve the release in GitHub Actions

    Required

    Resolve the release in the workflow that deploys your app to production. Resolving creates the release if it doesn't exist yet, so skip it for pull requests, preview builds, and local development. When `POSTHOG_RELEASE_ID` isn't set, the SDK sends no release ID.

    Add the `PostHog/resolve-release` action before the step that deploys your app:

    YAML

    ```yaml
    name: Deploy
    
    on:
      push:
        branches: [main]
    
    jobs:
      deploy:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v6
    
          - name: Resolve PostHog release
            id: posthog-release
            uses: PostHog/resolve-release@v1
            with:
              api-key: ${{ secrets.POSTHOG_CLI_API_KEY }}
              project-id: ${{ vars.POSTHOG_PROJECT_ID }}
              # For EU cloud:
              # host: https://eu.posthog.com
    
          - name: Deploy
            env:
              POSTHOG_RELEASE_ID: ${{ steps.posthog-release.outputs.release-id }}
            # Your deploy command. It must pass POSTHOG_RELEASE_ID to your app.
            run: ./deploy.sh
    ```

    The action finds the release for this commit, or creates it, and puts its ID in the `release-id` output. It names the release after the repository and uses the commit SHA as the version. If the same workflow also uploads source maps with that name and version, both steps use the same release.

    | **Input** | **Required** | **Description** |
    | --- | --- | --- |
    | `api-key` | Yes | Personal API key with the error tracking write scope. Get it from your [personal API key settings](https://app.posthog.com/settings/user-api-keys#variables) |
    | `project-id` | Yes | PostHog project ID. Get it from your [project settings](https://app.posthog.com/settings/project#variables) |
    | `host` | No | PostHog host URL. Defaults to US cloud. For EU cloud, set it to `https://eu.posthog.com` |
    | `release-name` | No | Release name. Defaults to the repository name |
    | `release-version` | No | Release version. Defaults to the commit SHA |

    To keep deploying when PostHog can't be reached, add `continue-on-error: true` and `timeout-minutes: 5` to the step. If the step fails, `release-id` is empty, and the SDK treats an empty `POSTHOG_RELEASE_ID` as unset.

    See the [action's README](https://github.com/PostHog/resolve-release#readme) for all inputs and outputs, and for how to share one release across several jobs.

    If you don't use GitHub Actions, see [without GitHub Actions](#without-github-actions).

3.  3

    ## Give the release ID to your app

    Required

    Your deployed app must have `POSTHOG_RELEASE_ID` in its environment when it starts. The SDK reads it once, when you create the PostHog client.

    Set it to the value of the `release-id` output, the same way you set your app's other environment variables.

4.  ## Verify the release

    Checkpoint

    Deploy the app and capture a test exception. Then open the issue in [error tracking](https://app.posthog.com/error_tracking).

    The stack trace shows the release, with its version and commit. The exception's `$release_id` property has the same value as the `release-id` output of the workflow.

## Without GitHub Actions

If you deploy with another CI system or a script, resolve the release with the [PostHog CLI](/docs/error-tracking/upload-source-maps/cli.md) 0.12.0 or later. Run these commands in your production deploy, from a checkout of your repository:

Terminal

```bash
npm install -g @posthog/cli

# Set these from your CI secrets
export POSTHOG_CLI_API_KEY=<personal_api_key>
export POSTHOG_CLI_PROJECT_ID=<project_id>
# For EU cloud:
# export POSTHOG_CLI_HOST=https://eu.posthog.com

export POSTHOG_RELEASE_ID=$(posthog-cli release resolve)
```

The command prints only the release ID. It reads the repository name and commit from Git. To choose your own, add `--release-name` and `--release-version`.

Then give `POSTHOG_RELEASE_ID` to your deployed app, so that it is in the app's environment when the app starts.

### Still have questions?

Ask PostHog AI

### Was this page useful?

HelpfulCould be better