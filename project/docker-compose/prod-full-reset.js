const fs = require('node:fs');
const { execSync } = require('node:child_process');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const lockDir = './lock';

async function main() {
    try {
        fs.mkdirSync(lockDir);
    } catch (error) {
        if (error.code === 'EEXIST') {
            throw new Error(
                'Another deployment is already running'
            );
        }
        throw error;
    }

    try {
        const active = fs.readFileSync('./prod/state/active-environment').toString().trim();

        if (!active) {
            throw new Error(
                'Unable to find active environment'
            );
        }

        if (active !== 'green' && active !== 'blue') {
            throw new Error('undefined active environment: ' + active);
        }
        execSync(
            `docker compose -p ${active} -f ./prod/prod-${active}.yml --env-file ./prod/.env.prod down`, {stdio: 'inherit'}
        );
        execSync(
            `docker compose -p -f ./prod/prod-infrastructure.yml --env-file ./prod/.env.prod down`, {stdio: 'inherit'}
        );
        await sleep(2000);
        execSync(
            `docker compose -p -f ./prod/prod-infrastructure.yml --env-file ./prod/.env.prod up -d`, {stdio: 'inherit'}
        );
        await sleep(10000);
        execSync(
            `docker compose -p ${active} -f ./prod/prod-${active}.yml --env-file ./prod/.env.prod up -d`, {stdio: 'inherit'}
        );

        await checkDockerHealth(active);
    } finally {
        fs.rmSync(lockDir, {recursive: true, force: true});
    }
}

async function checkDockerHealth(active) {
    let health = false; 
    const start = Date.now();
    while (!health && Date.now() - start < 120000) {
        const health1 = execSync(
            `docker inspect --format='{{.State.Health.Status}}' ${active}_api-gateway_1`
        ).toString().trim();

        const health2 = execSync(
            `docker inspect --format='{{.State.Health.Status}}' ${active}_api-gateway_2`
        ).toString().trim();

        health = (health1 === 'healthy' && health2 === 'healthy');

        await sleep(5000);
    }

    if (!health) {
        throw new Error('system did not become healthy!');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});