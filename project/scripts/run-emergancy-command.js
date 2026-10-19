require('dotenv').config();

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}`;

const input = process.argv[2];

if (!input) {
    throw 'Production file needs to be specified';
}

const commands = new Set ([
    'restart',
    'reset',
    'reset-half'
]);

if (!commands.has(input)) {
    throw new Error('file listed is not a production related file');
}

switch(input) {
    case 'restart': { 
        execSync(
            `ssh -p ${process.env.SSH_PORT} ${server} "node ./prod/restart-prod.js"`, {stdio: 'inherit'}
        );
        break;
    }
    case 'reset': {  
        execSync(
            `ssh -p ${process.env.SSH_PORT} ${server} "node ./prod/prod-full-reset.js"`, {stdio: 'inherit'}
        );
        break;
    }
    case 'reset-half': {  
        execSync(
            `ssh -p ${process.env.SSH_PORT} ${server} "node ./prod/prod-half-reset.js"`, {stdio: 'inherit'}
        );
        break;
    }
    default: throw new Error('bad input');
};