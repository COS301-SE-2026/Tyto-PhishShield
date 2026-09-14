require('dotenv').config();
const fs = require('node:fs');
const yaml = require('js-yaml');

const { execSync } = require('node:child_process');

const server = ` ${process.env.SERVER_USER}@${process.env.SERVER_IP}:./`;

const folder = 'staging/';

const devCompose = './project/docker-compose/dev-compose.yml';
const localCompose = './project/docker-compose/local-compose.yml';

const patterns = [
    /outlook_addin/,
    /website/,
    /app/,
    /caddy/,
    /rabbitmq/,
    /db/,
];

function main() {
    validate();
    console.log('Validation complete');
    console.log('Sending to server');
    send();
    console.log('Sent to server :)');
}

function send() {
    const commands = [
        `scp -P ${process.env.SSH_PORT} ${devCompose} ${server}${folder}`,
        `scp -P ${process.env.SSH_PORT} ./project/docker-compose/.env.dev ${server}${folder}`,
        `scp -P ${process.env.SSH_PORT} ./project/docker-compose/dev-caddy-conf/Caddyfile ${server}${folder}dev-caddy-conf`,
    ];

    for (const command of commands) {
        execSync(
            command,  { stdio: 'inherit' }
        );
    }
}

function validate() {
    console.log(`\nverifying ${devCompose}\n`);
    execSync(
        `docker compose -f ${devCompose} --env-file ./project/docker-compose/.env.dev config`
    );

    console.log(`\ncomparing ${localCompose} --> ${devCompose}\n`);
    const local = yaml.load(fs.readFileSync(localCompose));
    const dev = yaml.load(fs.readFileSync(devCompose));

    if (!dev.services || !local.services) {
        throw new Error('services not found in yaml file');
    }

    const devServices = new Set(Object.keys(dev.services));
    const localServices = new Set(Object.keys(local.services));
    checkMissingServices(localServices, devServices);

    for (const service of devServices) {
        compareEnvs(local, dev, service);
    }

}

function compareEnvs(local, dev, service) {
    console.log(`comparing ${service} ENVs`);
    for(const pattern of patterns) {
        if (pattern.test(service)) {
            const localService = local.services[service];
            const devService = dev.services[service];   
            compareEnv(localService, devService);
        }
    }
}

function compareEnv(localService, devService) {
    const ignoreEnv = /LOCAL/;
    const devEnv = new Set(getEnv(devService).map(([name]) => name));
    const localEnv = new Set(getEnv(localService).map(([name]) => name));

    const missingFromDev = [...localEnv].filter(env => (!devEnv.has(env) && !ignoreEnv.test(env)));

    if (missingFromDev.length) {
        console.log('ENV in local but not in dev: ');
        for (const env of missingFromDev) {
            console.log(`\n\t-${env}`);
        }
        throw new Error('Ensure these envs are included');
    }
}

function getEnv(service) {
  const environment = service?.environment || {};

  if (Array.isArray(environment)) {
    return environment.map(entry => {
      const index = entry.indexOf('=');

      if (index === -1) {
        return [entry, null];
      }

      return [
        entry.substring(0, index),
        entry.substring(index + 1),
      ];
    });
  }

  return Object.entries(environment);
}

function checkMissingServices(localServices, devServices) {
    const missingServices = [...localServices].filter((service) => {
        for(const pattern of patterns) {
            if (pattern.test(service)) {
                return !devServices.has(service);
            }
        }
        
        return false;
    });

    if (missingServices.length) {
        console.log('Services in local but not in dev: ');
        for (const service of missingServices) {
            console.log(`\n\t-${service}`);
        }
        throw new Error('Ensure these services are included');
    }
}

main();
