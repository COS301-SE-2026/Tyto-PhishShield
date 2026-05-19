# GitHub Actions workflow
## Set up
In your repository on GitHub, create a workflow file called `github-actions-demo.yml` in the `.github/workflows`

## [The components of GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions#the-components-of-github-actions)
You can configure a GitHub Actions **workflow** to be triggered when an **event** occurs in your repository, such as a pull request being opened or an issue being created. Your workflow contains one or more **jobs** which can run in sequential order or in parallel. Each job will run inside its own virtual machine **runner**, or inside a container, and has one or more **steps** that either run a script that you define or run an **action**, which is a reusable extension that can simplify your workflow.

![Diagram of an event triggering Runner 1 to run Job 1, which triggers Runner 2 to run Job 2. Each of the jobs is broken into multiple steps.](https://docs.github.com/assets/cb-25535/images/help/actions/overview-actions-simple.png)
## [Using a Node.js workflow template](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs#using-a-nodejs-workflow-template)

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Node.js that should work for most Node.js projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.
    
2. Under your repository name, click  **Actions**.
    
    ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](https://docs.github.com/assets/cb-12958/images/help/repository/actions-tab-global-nav-update.png)
    
3. If you already have a workflow in your repository, click **New workflow**.
    
4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Node.js".
    
5. Filter the selection of workflows by clicking **Continuous integration**.
    
6. On the "Node.js" workflow, click **Configure**.
    
7. Edit the workflow as required. For example, change the Node versions you want to use.
    
8. Click **Commit changes**.
    
    The `node.js.yml` workflow file is added to the `.github/workflows` directory of your repository.

Example:
```yaml
name: Node.js CI

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test
```
# Installing dependencies
### [Example using npm](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs#example-using-npm)

This example installs the versions in the `package-lock.json` or `npm-shrinkwrap.json` file and prevents updates to the lock file. Using `npm ci` is generally faster than running `npm install`. For more information, see [`npm ci`](https://docs.npmjs.com/cli/ci.html) and [Introducing `npm ci` for faster, more reliable builds](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable).
```yaml
steps:
- uses: actions/checkout@v6
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- name: Install dependencies
  run: npm ci
```
### [Example caching dependencies](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs#example-caching-dependencies)
The following example caches dependencies for pnpm (v6.10+).
```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# NOTE: pnpm caching support requires pnpm version >= 6.10.0

steps:
- uses: actions/checkout@v6
- uses: pnpm/action-setup@0609f0983b7a228f052f81ef4c3d6510cae254ad
  with:
    version: 6.10.0
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
- run: pnpm install
- run: pnpm test
```
## [Building and testing your code](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs#building-and-testing-your-code)
You can use the same commands that you use locally to build and test your code. For example, if you run `npm run build` to run build steps defined in your `package.json` file and `npm test` to run your test suite, you would add those commands in your workflow file.

# Using Containerized Services
https://docs.github.com/en/actions/tutorials/use-containerized-services/create-a-docker-container-action
https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers
https://docs.github.com/en/actions/tutorials/use-containerized-services/create-redis-service-containers

# Branch Protection
```YAML
# .github/branch-protection (or via API / Terraform)  
required_status_checks:  
strict: true # branch must be up-to-date before merge  
contexts:  
- build  
- lint  
- test-unit  
- test-integration  
required_pull_request_reviews:  
required_approving_review_count: 1
```
# Multi-stage builds: ship the binary, not the toolchain
```YAML
# ---- builder ----  
FROM node:20-alpine AS builder  
WORKDIR /app  
COPY package.json yarn.lock ./  
RUN yarn install --frozen-lockfile # full deps, including dev  
COPY . .  
RUN yarn build # emits ./dist  
# ---- runner ----  
FROM node:20-alpine AS runner  
WORKDIR /app  
ENV NODE_ENV=production  
COPY package.json yarn.lock ./  
RUN yarn install --frozen-lockfile --production # prod deps only  
COPY --from=builder /app/dist ./dist  
USER node  
CMD ["node", "dist/main.js"]
```
>[!Warning]
>Containers should not run as root
>Secrets do not belong in your repo

>[!Tip]
>Pin everything you depend on

```YAML
# floating — different image every week  
FROM node:20-alpine  
# better — patch-pin, but Alpine still floats  
FROM node:20.11.1-alpine3.19  
# best — content-addressed digest, byte-for-byte reproducible  
FROM node:20.11.1-alpine3.19@sha256:f4c96a28c0b2d8b4f1f4f2b3d5a...  
# Same pattern in CI:  
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```
# Limits and health checks
```YAML
services:  
api:  
image: my-api@sha256:...  
deploy:  
resources:  
limits: { cpus: "1.0", memory: "512M" }  
reservations: { cpus: "0.25", memory: "128M" }  
healthcheck:  
test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]  
interval: 10s  
timeout: 3s  
retries: 5
```
# Build the artefact once. Promote it through environments
```YAML
# build & push once, in CI on merge to main  
docker buildx build \  
--platform linux/amd64,linux/arm64 \  
-t ghcr.io/org/api:${GITHUB_SHA} \  
-t ghcr.io/org/api:main \  
--push .  
# scan and sign  
trivy image --exit-code 1 --severity HIGH,CRITICAL ghcr.io/org/api:${GITHUB_SHA}  
cosign sign --yes ghcr.io/org/api:${GITHUB_SHA}  
# deploy: change the tag in staging, then prod — never rebuild
kubectl set image deply/api api=ghcr.io/org/api:${GITHUB_SHA} -n staging
```
![[Pasted image 20260501201027.png]]


# Docker
https://docs.docker.com/get-started/docker-overview/
https://www.geeksforgeeks.org/devops/docker-containers-hosts/

## Set up images
Use premade images: search [Docker Hub](https://hub.docker.com/) for official images like `nginx`, `python`, or `ubuntu`
Command: `docker pull <image_name>`
Build custom image: 
```dockerfile
FROM python:3.9 # The base environment 
WORKDIR /app # Working directory inside the container
COPY . . # Copy your files into the container
RUN pip install -r reqs.txt # Install dependencies
CMD ["python", "app.py"] # Command to run your app
```
Build it using: `docker build -t my-app-name`
## Launch container
Use `docker run` command.
EG: `docker run -d -p 8080:80 --name my-web-server nginx`

# Using docker compose
https://docs.docker.com/compose/intro/compose-application-model/
Used to have the docker set up in the directory.
See: https://docs.docker.com/compose/gettingstarted/