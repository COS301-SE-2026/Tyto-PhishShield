require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const folder = 'staging/';

const command1 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/dev-compose.yml ${server}${folder}`;

execSync(
    command1,  { stdio: 'inherit' }
);

const command2 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/.env.dev ${server}${folder}`;

execSync(
    command2,  { stdio: 'inherit' }
);

const command3 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/dev-caddy-conf/Caddyfile ${server}${folder}dev-caddy-conf`;

execSync(
    command3,  { stdio: 'inherit' }
);
