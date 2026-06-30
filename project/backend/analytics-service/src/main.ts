import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 3000),
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'analytics-service.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log('analytics service listening on port: ' + process.env.PORT);
  console.log(
    'analytics tcp service listening on port: ' + process.env.TCP_PORT,
  );
}
bootstrap();
