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

        const target = active === 'blue' ? 'green' : 'blue';

        execSync(
            `docker compose -p ${target} -f ./prod/prod-${target}.yml --env-file ./prod/.env.prod pull`, {stdio: 'inherit'}
        );

        execSync(
            `docker compose -p ${target} -f ./prod/prod-${target}.yml --env-file ./prod/.env.prod up -d`, {stdio: 'inherit'}
        );

        await checkDockerHealth(target);

        switchCaddyfiles(active, target);

        await runSmokeTests(active, target);

        fs.writeFileSync('./prod/state/active-environment', target);
    } finally {
        fs.rmSync(lockDir, {recursive: true, force: true});
    }
}

async function runSmokeTests(active, target) {
    const endpoints = [
        {
            name: 'API health',
            url: 'https://capstone-five-guys.dns.net.za/api/health',
            validate: async response => {
                if (response.status !== 200) {
                    throw new Error(`returned HTTP ${response.status}`);
                }

                const body = await response.json();
                if (!body || typeof body.services !== 'object' || Object.keys(body.services).length === 0) {
                    throw new Error('returned an invalid health payload');
                }
            },
        },
        {
            name: 'website',
            url: 'https://capstone-five-guys.dns.net.za/',
            validate: async response => {
                if (response.status !== 200) {
                    throw new Error(`returned HTTP ${response.status}`);
                }

                const body = await response.text();
                if (!body.includes('<html')) {
                    throw new Error('did not return an HTML document');
                }
            },
        },
        {
            name: 'Outlook add-in manifest',
            url: 'https://capstone-five-guys.dns.net.za/addin/manifest.xml',
            validate: async response => {
                if (response.status !== 200) {
                    throw new Error(`returned HTTP ${response.status}`);
                }

                const body = await response.text();
                if (!body.includes('<OfficeApp')) {
                    throw new Error('did not return an Office add-in manifest');
                }
            },
        },
    ];

    let lastError;
    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            await Promise.all(endpoints.map(async endpoint => {
                const response = await fetch(endpoint.url, {
                    signal: AbortSignal.timeout(10000),
                });
                try {
                    await endpoint.validate(response);
                } catch (error) {
                    throw new Error(`${endpoint.name} ${error.message}`, {cause: error});
                }
            }));
            return;
        } catch (error) {
            lastError = error;
            console.warn(`Smoke tests attempt ${attempt}/6 failed: ${error.message}`);
            if (attempt < 6) {
                await sleep(2000);
            }
        }
    }

    try {
        restoreCaddyfile(active, target);
    } catch (error) {
        throw new Error(`Smoke tests failed and Caddy rollback failed: ${error.message}`, {cause: error});
    }

    throw new Error(`Smoke tests failed after deployment: ${lastError.message}`, {cause: lastError});
}

function restoreCaddyfile(active, target) {
    execSync(
        `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${target}`, {stdio: 'inherit'}
    );

    execSync(
        `cp ./prod/prod-caddy-conf/Caddyfile.${active} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
    );

    execSync(
        `docker exec prod_caddy caddy reload --config /etc/caddy/Caddyfile`, {stdio: 'inherit'}
    );
}

async function switchCaddyfiles(active, target) {
    execSync(
        `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${active}`, {stdio: 'inherit'}
    );

    execSync(
        `cp ./prod/prod-caddy-conf/Caddyfile.${target} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
    );
    
    try {
        execSync(
            `docker exec prod_caddy caddy validate --config /etc/caddy/Caddyfile`, { stdio: 'pipe' }
        );
    } catch (error) {
        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${target}`, {stdio: 'inherit'}
        );

        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile.${active} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
        );

        throw new Error('Caddyfile not valid! ' + error); 
    }

    try {
        execSync(
            `docker exec prod_caddy caddy reload --config /etc/caddy/Caddyfile`, {stdio: 'inherit'}
        );
    } catch (error) {
        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${target}`, {stdio: 'inherit'}
        );

        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile.${active} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
        );

        throw 'Caddyfile not valid! ' + error; 
    }
}

async function checkDockerHealth(target) {
    let health = false; 
    const start = Date.now();
    while (!health && Date.now() - start < 120000) {
        const health1 = execSync(
            `docker inspect --format='{{.State.Health.Status}}' ${target}_api-gateway_1`
        ).toString().trim();

        const health2 = execSync(
            `docker inspect --format='{{.State.Health.Status}}' ${target}_api-gateway_2`
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
