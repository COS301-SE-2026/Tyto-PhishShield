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
import { rateLimit } from 'express-rate-limit';
import { logger } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const allowedOrigins = new Set([
    'https://' + process.env.SERVER_DOMAIN,
    process.env.LOCAL_CORS,
    process.env.OUTLOOK_ADDIN_CORS
  ]);

  app.enableCors({
    origin: (origin: any, callback: (error: any, value: boolean) => {}) => {
      if (origin && allowedOrigins.has(origin)) return callback(null, true);
      else return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.use('/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many requests. '}
    })
  );

  const config = new DocumentBuilder()
    .setTitle('PhishShield API Gateway')
    .setDescription('Single entry point for all PhishShield backend services')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.API_GATEWAY_PORT ?? 3001);

  logger.info(
    `API Gateway running on port ${process.env.API_GATEWAY_PORT ?? 3001}`,
  );
}

void bootstrap();
