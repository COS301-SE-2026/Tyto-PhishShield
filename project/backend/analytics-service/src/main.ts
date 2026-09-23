import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 3000),
      tlsOptions: httpsOptions,
    },
  });
  app.setGlobalPrefix('api');
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log('analytics service listening on port: ' + process.env.PORT);
  console.log(
    'analytics tcp service listening on port: ' + process.env.TCP_PORT,
  );
}
bootstrap();
