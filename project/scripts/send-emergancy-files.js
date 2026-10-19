require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;
const folder = 'prod/';

const commands = [
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-full-reset.js ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/restart-prod.js ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-half-reset.js ${server}${folder}`,
];

for (const command of commands) {
    execSync(
        command,  { stdio: 'inherit' }
    );
}
