const fs = require('node:fs');
const { execSync } = require('node:child_process');

const lockDir = 'lock';

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

    const target = active === 'blue' ? 'green' : 'blue';

    execSync(
        `docker compose -f ./prod/prod-${target}.yml --env-file .env.prod pull`, {stdio: 'inherit'}
    );

    execSync(
        `docker compose -f ./prod/prod-${target}.yml --env-file .env.prod up`, {stdio: 'inherit'}
    );

} finally {
    fs.rmSync(lockDir);
}

