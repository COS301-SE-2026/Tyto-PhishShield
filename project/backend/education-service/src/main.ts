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
      port: Number(process.env.TCP_PORT ?? 4005),
    },
  });

  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'education-service.queue',
        queueOptions: { durable: true },
      },
    });
  }

  const config = new DocumentBuilder()
    .setTitle('PhishShield Education Service')
    .setDescription(
      'Phishing awareness quizzes for users who fail phishing simulations',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3006);
  console.log(`Education Service HTTP on port ${process.env.PORT ?? 3006}`);
  console.log(`Education Service TCP on port ${process.env.TCP_PORT ?? 4005}`);
}

void bootstrap();
