import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { MailingServiceModule } from './mailing-service.module';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(MailingServiceModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.MAILING_TCP_PORT),
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'mailing-service.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  const configService = app.get(ConfigService);
  const port = configService.get<number>('MAILING_SERVICE_PORT');
  await app.listen(port);
  await app.startAllMicroservices();
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start the application', err);
  process.exit(1);
});
