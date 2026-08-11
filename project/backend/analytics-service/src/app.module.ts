import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './analytics/entities/analytics-event.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailStatusModule } from './email-status/email-status.module';
import { EmailStatusEntity } from './email-status/entities/email-status.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [AnalyticsEvent, EmailStatusEntity],
        synchronize: true,
      }),
    }),
    AnalyticsModule,
    AuthModule,
    EmailStatusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
