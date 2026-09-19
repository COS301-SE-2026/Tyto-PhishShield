/**
 * Bootstrap script for the Accounts service.
 *
 * - Sets up global validation and starts the Nest HTTP server for account management.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';

async function bootstrap() {
  if (!process.env.NODE_EXTRA_CA_CERTS || !process.env.TLS_CERT_PATH || !process.env.TLS_KEY_PATH) {
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
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 4001),
      tlsOptions: httpsOptions,
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'accounts-service.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(cookieParser());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  await app.startAllMicroservices();
  console.log(`accounts Service is running on port ${port}`);
}
void bootstrap();
