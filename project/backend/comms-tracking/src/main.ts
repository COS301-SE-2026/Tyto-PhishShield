import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.TCP_PORT ?? 4009),
    },
  });

  app.setGlobalPrefix('api');
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3008);

  console.log('comms-tracking listening on port: ' + process.env.PORT);
  console.log('comms-tracking TCP listening on port: ' + process.env.TCP_PORT);
}
void bootstrap();
