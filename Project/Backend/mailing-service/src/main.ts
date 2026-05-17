import { NestFactory } from '@nestjs/core';
import { MailingServiceModule } from './mailing-service.module';

async function bootstrap() {
    const app = await NestFactory.create(MailingServiceModule);
    await app.listen(3003);
}
bootstrap();