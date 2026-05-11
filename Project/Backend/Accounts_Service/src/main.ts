import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Accounts Service')
    .setDescription('The Accounts Service description')
    .setVersion('1.0')
    .addTag('accounts-service')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('accounts-api', app, documentFactory);

  await app.listen(process.env.Accounts_Service_PORT ?? 3002);
}
bootstrap();
