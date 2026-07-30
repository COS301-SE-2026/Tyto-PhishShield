import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 4003),
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'report-service.queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Phishshield Report Service')
    .setDescription('Phishing report submissions from the Outlook add-in')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log('Report service listening on port: ' + process.env.PORT);
  console.log('Report TCP service listening on port: ' + process.env.TCP_PORT);
}

void bootstrap();
