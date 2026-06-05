# Backend
Welcome to the backend files.
___
[View the API Gateway](api-gateway/README.md)

[View the Accounts Service](accounts-service/README.md)

[View the Mailing Service](mailing-service/README.md)

[View the Report Service](report-service/README.md)

[View the XP Service](xp-service/README.md)
___
## Technologies used
NestJS, PostgreSQL, Docker, Jest, SuperTest

# How to add a service in NestJS

step 1: Make sure you are in the backend folder - `cd project/backend`

step 2: Create the service - `nest new <service-name> -p pnpm` <br>
enter the service folder `cd <service-name>` <br>
ensure there are no git folders in the service (this can mess up the git repository a bit)

(optional step): to add postgress modules - `pnpm add @nestjs/typeorm typeorm pg`

step 3: update `src/main.ts`:
```Typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.TCP_PORT ?? 3000),
      },
    },
  );

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>(
      {
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: '<service queue name>.queue',
          queueOptions: {
            durable: true
          }
        }
      }
    );
  }

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log("<service name> listening on port: " + process.env.PORT);
  console.log("<serice TCP name> listening on port: " + process.env.TCP_PORT);
}
bootstrap();
```

Step 4: add docker file `Dockerfile`
```Dockerfile
FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/<service-name>/package.json ./project/backend/<service-name>/package.json
COPY project/backend/<service-name>/ ./project/backend/<service-name>/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/<service-name>

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

USER appuser

CMD ["node", "dist/main.js"]
```

Step 5: update .env (the main env to update should be in `root/docker-compose/.env`)
```yml
# add the following

<service name>_PORT=<main port number>
<service>_TCP_PORT=<tcp port number>
<service>_DB_PORT=<db port number> # if using a database

# Container Names
<service>_DB_CONTAINER=<service>_db
<service>_APP_CONTAINER=<service>_app

# Database name
<service>_DB_NAME=<service>_db
```

Step 6: update the compose `local-compose.yml`:
```yml
# If using a postgres db
<service>_db:
    image: postgres:15-alpine
    restart: always

    # Must have own name
    container_name: ${<service>_DB_CONTAINER}

    # Env variables, must be unique
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${<service>_DB_NAME}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d ${<service>_DB_NAME}"]
      interval: 1m30s
      timeout: 30s
      retries: 5
      start_period: 30s

    volumes:
      - <service>_pgdata:/var/lib/postgresql/data

    ports:
      # Left side must be unique
      - "$<service>_DB_PORT:5432"
      
# Main service app container
  <service>_app:
    build:
      context: ../../
      dockerfile: project/backend/<service-name>/Dockerfile

      # Must be unique
    container_name: ${<service>_APP_CONTAINER}
    env_file:
      - .env
    environment:
      - PORT=<port number>
      - TCP_PORT=${<service>_TCP_PORT}
      - DB_HOST=<service>_db
      - <service>_DB_PORT=5435
      - RABBITMQ_URL=amqp://rabbitmq:5672

    ports:
      # Left side must be unique
      - "${<service name>_PORT}:3005"

    depends_on:
      <service>_db:
        condition: service_healthy
    volumes:
      - ./src:/app/src

# under volumes if using db
volumes:
    #...
    <service>_pgdata:
    #...
```