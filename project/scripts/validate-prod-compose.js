const fs = require('node:fs');
const yaml = require('js-yaml');
const { execSync } = require('node:child_process');

const devFile = './project/docker-compose/dev-compose.yml';
const input = process.argv[2];

if (!input) {
    throw 'Production file needs to be specified';
}

const possibleProdFiles = new Set ([
    'prod-blue.yml',
    'prod-compose.yml',
    'prod-green.yml',
    'prod-infrastructure.yml',
]);

if (!possibleProdFiles.has(input)) {
    throw new Error('file listed is not a production related file');
}

let file = '';
//for security reasons
switch(input) {
    case 'prod-blue.yml': { file = 'prod-blue.yml'; break; }
    case 'prod-compose.yml': { file =  'prod-compose.yml'; break; }
    case 'prod-green.yml': { file =  'prod-green.yml'; break; }
    case 'prod-infrastructure.yml': { file = 'prod-infrastructure.yml'; break; }
    default: throw new Error('bad input');
};

const prodFile = './project/docker-compose/' + file;

const appServices = [
    /outlook_addin/,
    /website/,
    /app/,
];

const infraServices = [
    /caddy/,
    /rabbitmq/,
    /db/,
];

const infraPattern = /infrastructure/;
const typeOfService = infraPattern.test(prodFile) ? 'infra' : 'app';

function main() {
    console.log(`\nverifying ${prodFile}\n`);
    execSync(
        `docker compose -f ${prodFile} --env-file ./project/docker-compose/.env.prod config`
    );

    console.log(`\ncomparing ${devFile} --> ${prodFile}\n`);
    const dev = yaml.load(fs.readFileSync(devFile));
    const prod = yaml.load(fs.readFileSync(prodFile));

    if (!dev.services || !prod.services) {
        throw new Error('services not found in yaml file');
    }

    const devServices = new Set(Object.keys(dev.services));
    const prodServices = new Set(Object.keys(prod.services));

    checkMissingServices(devServices, prodServices);

    for (const service of devServices) {
        let patterns;
        if (typeOfService === 'infra') {
            patterns = infraServices;
        } else if (typeOfService === 'app') {
            patterns = appServices;
        } else {
            continue;
        }
        compareEnvs(patterns, dev, prod, service);
    }

    console.log('check passed\n');
}

function compareEnvs(patterns, dev, prod, service) {
    console.log(`comparing ${service} ENVs`);
    for(const pattern of patterns) {
        if (pattern.test(service)) {
            const devService = dev.services[service];

            if (service === 'api_app') {
                const prodService1 = prod.services['api_app1'];
                const prodService2 = prod.services['api_app2'];
                compareEnv(devService, prodService1);
                compareEnv(devService, prodService2);
            } else {
                const prodService = prod.services[service];   
                compareEnv(devService, prodService);
            }
        }
    }
}

function checkMissingServices(devServices, prodServices) {
    const missingServices = [...devServices].filter((service) => {
        let patterns;
        if (typeOfService === 'infra') {
            patterns = infraServices;
        } else if (typeOfService === 'app') {
            patterns = appServices;
        } else {
            return false;
        }

        for(const pattern of patterns) {
            if (pattern.test(service)) {
                if (service === 'api_app') return !prodServices.has('api_app1') || !prodServices.has('api_app2');
                return !prodServices.has(service);
            }
        }
        
        return false;
    });

    if (missingServices.length) {
        console.log('Services in dev but not in prod: ');
        for (const service of missingServices) {
            console.log(`\n\t-${service}`);
        }
        throw new Error('Ensure these services are included');
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

function compareEnv(devService, prodService) {
    const devEnv = new Set(getEnv(devService).map(([name]) => name));
    const prodEnv = new Set(getEnv(prodService).map(([name]) => name));

    const missingFromProd = [...devEnv].filter(env => !prodEnv.has(env));

    if (missingFromProd.length) {
        console.log('ENV in dev but not in prod: ');
        for (const env of missingFromProd) {
            console.log(`\n\t-${env}`);
        }
        throw new Error('Ensure these envs are included');
    }
}

main();