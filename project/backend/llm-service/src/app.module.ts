import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmGatewayModule } from './llm/llm-gateway/llm-gateway.module';
import { LlmModule } from './llm/llm.module';
import { ReplyGuardService } from './llm/reply-guard/reply-guard.service';
import { rabbitMQModule } from './rabbitmq.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentSimulationMessageEntity } from './mailing-event/entities/sent-simulation-message.entity';
import { MailingEventModule } from './mailing-event/mailing-event.module';

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
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        entities: [SentSimulationMessageEntity],
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([SentSimulationMessageEntity]),
    LlmGatewayModule,
    LlmModule,
    MailingEventModule,
    rabbitMQModule,
  ],
  controllers: [AppController],
  providers: [AppService, ReplyGuardService],
})
export class AppModule {}
