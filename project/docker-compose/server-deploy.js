const fs = require('node:fs');
const { execSync } = require('node:child_process');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const lockDir = 'lock';

async function main() {
    try {
        fs.mkdirSync(lockDir);
    } catch {
        throw new Error(
            'Another deployment is already running'
        );
    }

    try {
        const active = fs.readFileSync('./prod/state/active-environment').trim();

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
            `docker compose -f ./prod/prod-${target}.yml --env-file .env.prod pull`, {stdio: 'inherit'}
        );

        execSync(
            `docker compose -f ./prod/prod-${target}.yml --env-file .env.prod up -d`, {stdio: 'inherit'}
        );

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

        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${active}`, {stdio: 'inherit'}
        );

        execSync(
            `cp ./prod/prod-caddy-conf/Caddyfile.${target} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
        );
        
        try {
            execSync(
                `docker exec caddy caddy validate --config /etc/caddy/Caddyfile`, { stdio: 'pipe' }
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
                `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`, {stdio: 'inherit'}
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

        let healthy = false;

        for (let i = 0; i < 6; i++) {
            await sleep(2000);

            const apiResponse = await fetch('https://capstone-five-guys.dns.net.za/api/health');

            const addinResponse = await fetch('https://capstone-five-guys.dns.net.za/addin/manifest.xml');

            const websiteResponse = await fetch('https://capstone-five-guys.dns.net.za/');
            
            healthy = websiteResponse.status === 200 && addinResponse.status === 200 && apiResponse.status === 200;
        }
        
        if (!healthy) {
            execSync(
                `cp ./prod/prod-caddy-conf/Caddyfile ./prod/prod-caddy-conf/Caddyfile.${target}`, {stdio: 'inherit'}
            );

            execSync(
                `cp ./prod/prod-caddy-conf/Caddyfile.${active} ./prod/prod-caddy-conf/Caddyfile`, {stdio: 'inherit'}
            );

            execSync(
                `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`, {stdio: 'inherit'}
            );

            await sleep(1000);

            throw new Error('system not reachable through caddy!');
        }


        fs.writeFileSync('./prod/state/active-environment', target);
    } finally {
        fs.rmSync(lockDir);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});


