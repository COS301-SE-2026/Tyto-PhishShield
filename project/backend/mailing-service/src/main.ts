import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MailingServiceModule } from './mailing-service.module';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(MailingServiceModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('MAILING_SERVICE_PORT') || 3003;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start the application', err);
  process.exit(1);
});
