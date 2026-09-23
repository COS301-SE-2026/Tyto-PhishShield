import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  if (
    !process.env.NODE_EXTRA_CA_CERTS ||
    !process.env.TLS_CERT_PATH ||
    !process.env.TLS_KEY_PATH
  ) {
    throw new Error('Undefined https options!');
  }
  const httpsOptions = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    ca: fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS),
    requestCert: true,
    rejectUnauthorized: true,
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.setGlobalPrefix('api');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 3000),
      tlsOptions: httpsOptions,
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'llm.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
  await app.startAllMicroservices();
  console.log('llm-service listening on port: ' + process.env.PORT);
  console.log('llm tcp service listening on port: ' + process.env.TCP_PORT);
}
bootstrap();
