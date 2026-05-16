import { Module } from '@nestjs/common';
import { MailingServiceService } from './mailing-service.service';
import { MailingServiceController } from './mailing-service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeneratedEmail } from '../entities/generated-emails.entity';
import { SendEmailService } from './send-email/send-email.service';
import { SendEmailModule } from './send-email/send-email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedEmail]),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('MAILING_DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('MAILING_DB_NAME'),
        synchronize: configService.get<string>('DB_SYNC') === 'true',
        autoLoadEntities: true,
        schema: 'mailing',
      }),
    }),

    SendEmailModule,
  ],
  controllers: [MailingServiceController],
  providers: [MailingServiceService, SendEmailService],
})
export class MailingServiceModule {}
