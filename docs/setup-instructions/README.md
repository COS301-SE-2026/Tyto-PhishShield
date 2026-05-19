# Initial setup for project
## Install pnpm and nestjs
Install pnpm: `npm install -g pnpm` <br>
Make sure you have pnpm v11+ - `pnpm -v` <br>
Set up pnpm: `pnpm setup` <br>
Open new terminal to start using pnpm. (May have to restart code editor if using vs code for example.) <br>
Install nestJS: `pnpm install -g @nestjs/cli@11.0.21` <br>

## Install dependencies
In the root of the folder run: `pnpm install` or `pnpm bootstrap` <br>
To update dependencies run: `pnpm update:all`

## Run and Build
To run all the services use: `pnpm run:all` <br>
To run a specific service use: `pnpm run:<service-project-name>` <br>
*See the root [package.json](../../package.json) file for all the avaliable commands.<br>
<br>
To build the whole project use: `pnpm build:all` <br>
To build a specific service use: `pnpm build:<service-project-name>` <br>

## Docker
Make sure you have docker on your system. <br>
To run containers use: `pnpm dc:up:<service-container-name>` <br>
To stop containers use: `pnpm  dc:down:<service-container-name` <br>
*Also see the root [package.json](../../package.json) file for all the avaliable commands.