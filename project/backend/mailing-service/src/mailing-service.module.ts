import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailTemplateEntity } from './entities/email-template.entity';
import { UserEntity } from './entities/user.entity';
import { EmailModule } from './email/email.module';
import { MailingServiceController } from './mailing-service.controller';
import { BatchEmailModule } from './batch-email/batch-email.module';
import { mailingRabbitMQModule } from './rabbitmq.module';
import { AccountsModule } from './accounts/accounts.module';
import { WaveEntity } from './entities/wave.entity';
import { WaveRecipientEntity } from './entities/wave-recipient.entity';
import { WaveModule } from './wave/wave.module';
import { EmployeeInfoModule } from './employee-info/employee-info.module';
import { EmployeeInfoEntity } from './entities/employee-info.entity';
import { ConnectionModule } from './connection/connection.module';
import { SenderResolverModule } from './sender-resolver/sender-resolver.module';
import { ConnectionEntity } from './entities/connection.entity';

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
        entities: [
          EmailTemplateEntity,
          UserEntity,
          WaveEntity,
          WaveRecipientEntity,
          EmployeeInfoEntity,
          ConnectionEntity,
        ],
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([EmailTemplateEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([WaveEntity]),
    TypeOrmModule.forFeature([WaveRecipientEntity]),
    TypeOrmModule.forFeature([ConnectionModule]),
    mailingRabbitMQModule,
    EmailModule,
    BatchEmailModule,
    AccountsModule,
    WaveModule,
    EmployeeInfoModule,
    ConnectionModule,
    SenderResolverModule,
  ],
  controllers: [MailingServiceController],
})
export class MailingServiceModule {}
