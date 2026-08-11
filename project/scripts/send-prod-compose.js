require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const folder = 'prod/';

const commands = [
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-compose.yml ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/.env.prod ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-caddy-conf/Caddyfile ${server}${folder}prod-caddy-conf`
];

commands.forEach((command) => {
    execSync(
        command,  { stdio: 'inherit' }
    );
});
