require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const folder = 'prod/';

const prodFile = process.argv[2];

const possibleProdFiles = new Set ([
    'prod-blue.yml',
    'prod-compose.yml',
    'prod-green.yml',
    'prod-infrastructure.yml',
]);

if (!possibleProdFiles.has(prodFile)) {
    throw 'file listed may not be uploaded to the server';
}

const commands = [
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/.env.prod ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/server-deploy.js ${server}${folder}`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-caddy-conf/Caddyfile.green ${server}${folder}prod-caddy-conf`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/prod-caddy-conf/Caddyfile.blue ${server}${folder}prod-caddy-conf`,
    `scp -P ${process.env.SSH_PORT} ./project/docker-compose/${prodFile} ${server}${folder}`,
];

commands.forEach((command) => {
    execSync(
        command,  { stdio: 'inherit' }
    );
});
