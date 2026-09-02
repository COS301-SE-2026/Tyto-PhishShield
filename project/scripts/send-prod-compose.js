require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const folder = 'prod/';

const input = process.argv[2];

if (!input) {
    throw 'Production file needs to be specified';
}

const possibleProdFiles = new Set ([
    'prod-blue.yml',
    'prod-compose.yml',
    'prod-green.yml',
    'prod-infrastructure.yml',
]);

if (!possibleProdFiles.has(input)) {
    throw new Error('file listed is not a production related file');
}

let file = '';
//for security reasons
switch(input) {
    case 'prod-blue.yml': { file = 'prod-blue.yml'; break; }
    case 'prod-compose.yml': { file =  'prod-compose.yml'; break; }
    case 'prod-green.yml': { file =  'prod-green.yml'; break; }
    case 'prod-infrastructure.yml': { file = 'prod-infrastructure.yml'; break; }
    default: throw new Error('bad input');
};

const prodFile = file;

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
