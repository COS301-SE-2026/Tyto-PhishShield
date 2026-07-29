require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const command1 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/dev-compose.yml ${server}`;

execSync(
    command1,  { stdio: 'inherit' }
);

const command2 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/.env.dev ${server}`;

execSync(
    command2,  { stdio: 'inherit' }
);

const command3 = `scp -P ${process.env.SSH_PORT} ./project/docker-compose/dev-caddy-conf/Caddyfile ${server}dev-caddy-conf`;

execSync(
    command3,  { stdio: 'inherit' }
);

// const AddinCommands = [
//     `scp -P ${process.env.SSH_PORT} -r ./project/frontend/phishshield-outlook-addin/ ${server}Addin`,

// ]

// AddinCommands.forEach(command => {
//     execSync(
//         command, { stdio: 'inherit' }
//     );
// });
