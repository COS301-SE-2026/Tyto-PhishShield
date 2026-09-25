require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const command = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/edge-caddy-conf/Caddyfile ${server}edge-caddy-conf`;

execSync(
    command,  { stdio: 'inherit' }
);
