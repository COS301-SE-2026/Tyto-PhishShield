import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from './entities/email-template.entity';
import { UserEntity } from './entities/user.entity';
import { mailingRabbitMQModule } from './rabbitmq.module';
import { BatchEmailModule } from './batch-email/batch-email.module';
import { WaveModule } from './wave/wave.module';
import { WaveEntity } from './entities/wave.entity';
import { WaveRecipientEntity } from './entities/wave-recipient.entity';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('WAVES_DB_CONTAINER'),
        port: configService.get<number>('INTERNAL_DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('WAVES_DB_NAME'),
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        entities: [
          EmailTemplateEntity,
          UserEntity,
          WaveEntity,
          WaveRecipientEntity,
        ],
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([EmailTemplateEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([WaveEntity]),
    TypeOrmModule.forFeature([WaveRecipientEntity]),
    mailingRabbitMQModule,
    BatchEmailModule,
    WaveModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
