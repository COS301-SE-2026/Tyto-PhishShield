import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.XP_TCP_PORT ?? 4004),
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'xp-service.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  await app.startAllMicroservices();
  await app.listen(process.env.XP_SERVICE_PORT ?? 3000);
  console.log('XP service listening on port: ' + process.env.XP_SERVICE_PORT);
  console.log('XP TCP service listening on port: ' + process.env.XP_TCP_PORT);
}
void bootstrap();
