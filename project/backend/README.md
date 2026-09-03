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

(optional step): to add postgress modules - `pnpm add @nestjs/typeorm typeorm pg`<br>
(optional step): to add rabbitMQ modules - `pnpm add @golevelup/nestjs-rabbitmq amqplib`<br>
(optional step): to add microservice modules - `pnpm add @nestjs/microservices`<br>

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

Optional Add DB configuration to app.module.ts at the imports section:
```Typescript
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [/* any entities in the service */],
        synchronize: true,
      }),
    }),
```

Step 4: add docker file `Dockerfile`
```Dockerfile
FROM ghcr.io/pnpm/pnpm:11.1.1@sha256:18bcf6373f2ca9b74f13d939951f02b4514ec10a6f548fec8cfe28eb02cc4b4f AS build

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 24 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/<service name>/package.json ./project/backend/<service name>/package.json

RUN pnpm config set fetch-retries 8 -g \
 && pnpm config set fetch-retry-mintimeout 10000 -g \
 && pnpm config set fetch-retry-maxtimeout 120000 -g \
 && pnpm config set fetch-timeout 120000 -g \
 && pnpm config set network-concurrency 8 -g \
 && pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

COPY project/backend/<service name>/ ./project/backend/<service name>/

WORKDIR /app/project/backend/<service name>

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

RUN pnpm deploy --filter <service name> --prod /out

FROM node:24.19-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

WORKDIR /app

RUN chown -R appuser:phishshield /app
 
COPY --from=build /out ./
COPY --from=build /app/project/backend/<service name>/dist/ ./dist/

USER appuser

CMD ["node", "dist/main.js"]
```

Step 5: update .env (the main env to update should be in `root/docker-compose/.env.local`)
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

    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: '128M'
        reservations:
          cpus: '0.15'
          memory: 64M

    ports:
      # Left side must be unique
      - "${<service>_DB_PORT}:${INTERNAL_DB_PORT}"
      
# Main service app container
  <service>_app:
    build:
      context: ../../
      dockerfile: project/backend/<service-name>/Dockerfile

      # Must be unique
    container_name: ${<service>_APP_CONTAINER}
    environment:
      - PORT=${<service-name>_PORT}
      - TCP_PORT=${<service>_TCP_PORT}
      - DB_HOST=${<service>_DB_CONTAINER}
      - DB_PORT=${INTERNAL_DB_PORT}
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${<service>_DB_NAME}
      - RABBITMQ_URL=amqp://rabbitmq:5672

    ports:
      # Left side must be unique
      - "${<service-name>_PORT}:${<service-name>_PORT}"

    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: '128M'

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

# How to connect event exchanges

step 1: Add event producer component<br>
event-producer.module.ts:
```TypeScript
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventProducerService } from './event-producer.service';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      //array of exchanges can have multiple exchanges
      exchanges: [
        {
          name: EventProducerService.EVENT_EXCHANGE,
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    }),
  ],
  providers: [EventProducerService],
  exports: [EventProducerService],
})
export class EventProducerModule {}
```
eventproducer.service.ts
```Typescript
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EventProducerService {
  public static readonly EVENT_EXCHANGE: string = /*<exchange name>*/; //Can have multiple exchanges
  constructor(private readonly rmqClient: AmqpConnection) {}

  publishCustomEvent() {
    this.rmqClient.publish(
      EventProducerService.EVENT_EXCHANGE,
      /*<event name>*/,
      /*<payload>*/,
    );
  }
}
```
Step 2: Connect Consumer to producer<br>
Add this to the module.ts
```Typescript
imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: /*<exchange name>*/, //must be the same as the one on which the events will be shared
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: {
        wait: false,
      },
    })
  ],
```
Use RabbitSubscribe in controller to subscribe to an event on an exchange
```Typescript
@RabbitSubscribe({
    exchange: /*<exchange name>*/,
    routingKey: /*<event name>*/,
    queue: /*<own personal queue>*/,
  })
  somefunction() {}
```
