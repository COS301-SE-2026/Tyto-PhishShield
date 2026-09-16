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
import { requestIdMiddleware } from './middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
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
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

  if (process.env.ENVIRONMENT != 'local') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const allowedOrigins = new Set(
    [
      process.env.SERVER_DOMAIN
        ? `https://${process.env.SERVER_DOMAIN}`
        : undefined,
      process.env.LOCAL_CORS,
      process.env.OUTLOOK_ADDIN_CORS,
    ].filter((value): value is string => Boolean(value)),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: any, allow?: boolean) => void,
    ) => {
      if (origin && allowedOrigins.has(origin)) return callback(null, true);
      else return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many requests. ' },
    }),
  );

  if (process.env.ENVIRONMENT == 'local') {
    const config = new DocumentBuilder()
      .setTitle('PhishShield API Gateway')
      .setDescription('Single entry point for all PhishShield backend services')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api-docs', app, document, {
      jsonDocumentUrl: 'api/json',
      yamlDocumentUrl: 'api/yaml',
    });
  }

  await app.listen(process.env.API_GATEWAY_PORT ?? 3001);

  app.set('trust proxy', 1);

  logger.info(
    `API Gateway running on port ${process.env.API_GATEWAY_PORT ?? 3001}`,
  );
}

void bootstrap();
