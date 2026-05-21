/**
 * Bootstrap for the API Gateway application.
 *
 * - Creates and configures the Nest application (validation, CORS, Swagger).
 * - Starts the HTTP server on the configured port.
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('PhishShield API Gateway')
    .setDescription('Single entry point for all PhishShield backend services')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.API_GATEWAY_PORT ?? 3001);

  console.log(
    `API Gateway running on port ${process.env.API_GATEWAY_PORT ?? 3001}`,
  );
}

void bootstrap();
