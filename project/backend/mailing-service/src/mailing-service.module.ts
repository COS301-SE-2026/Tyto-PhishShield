import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Emails } from './entities/emails.entity';
import { EmailModule } from './email/email.module';
import { MailingServiceController } from './mailing-service.controller';
import { BatchEmailModule } from './batch-email/batch-email.module';
import { mailingRabbitMQModule } from './rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('MAILING_DB_CONTAINER'),
        port: configService.get<number>('INTERNAL_DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('MAILING_DB_NAME'),
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        entities: [Emails],
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([Emails]),
    mailingRabbitMQModule,
    EmailModule,
    BatchEmailModule,
  ],
  controllers: [MailingServiceController],
})
export class MailingServiceModule {}
