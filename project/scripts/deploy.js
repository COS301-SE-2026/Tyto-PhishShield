const { execSync } = require('node:child_process');
require('dotenv').config();
const fs = require('node:fs');

const server = `${process.env.SERVER_USER}@${process.env.SERVER_IP}`;

const lockFile = 'deployment.lock';
const deployType = process.argv[2];

function main () {
    if (fs.existsSync(lockFile)) {
        throw 'Another deployment is already running';
    }

    fs.writeFileSync(lockFile, process.pid.toString());

    try {
        if(deployType === 'infrastructure') {
            deployInfra();
        } else {
            deployServices();
        }
    } finally {
        fs.unlinkSync(lockFile);
    }
}

function deployInfra() {
    execSync(
        'pnpm validate:infra',  { stdio: 'inherit' }
    );
    console.log('sending infratructure compose file to the server.');
    execSync(
        'pnpm server:update:prod',  { stdio: 'inherit' }
    );
    console.log('starting infrastructure');
    execSync(
        `ssh -p ${process.env.SSH_PORT} ${server} "docker compose -f ./prod/prod-infrastructure.yml --env-file ./prod/.env.prod up -d"`, {stdio: 'inherit'}
    );
}

function deployServices() {
    const active = execSync(
        `ssh -p ${process.env.SSH_PORT} ${server} "cat ./prod/state/active-environment"`
    ).toString().trim();
    if (!active) {
        throw new Error('unable to find active environemnt');
    }
    const target = active === 'blue' ? 'green' : 'blue';

    execSync(
        `pnpm validate:${target}`, { stdio: 'inherit' }
    );
    console.log(`sending ${target} compose file to the server.`);
    execSync(
        `node ./project/scripts/send-prod-compose.js prod-${target}.yml`, { stdio: 'inherit' }
    );

    execSync(
        `ssh -p ${process.env.SSH_PORT} ${server} "node ./prod/server-deploy.js"`, {stdio: 'inherit'}
    );
}

main();