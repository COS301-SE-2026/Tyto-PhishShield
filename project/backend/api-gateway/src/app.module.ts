/**
 * AppModule — API Gateway root module.
 *
 * - Configures global configuration and registers backend modules.
 * - Exposes controllers that forward requests to downstream services.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MailingModule } from './mailing/mailing.module';

import { ReportModule } from './report/report.module';
import { EducationModule } from './education/education.module';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  Reflector,
} from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { XpModule } from './xp/xp.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OtpModule } from './otp/otp.module';
import { WebhookModule } from './webhook/webhook.module';
import { LlmModule } from './llm/llm.module';
import { CompanyModule } from './company/company.module';
import { ProxyModule } from './proxy/proxy.module';
import { CommsModule } from './comms/comms.module';
import { PostHogUserContextInterceptor } from './posthog.service';
import { PostHogExceptionFilter } from './posthog-exception.filter';
import { PostHogModule } from './posthog.module';
import { PostHogLogsService } from './posthog-logs.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostHogModule,
    AccountsModule,
    MailingModule,
    ReportModule,
    XpModule,
    EducationModule,
    AnalyticsModule,
    OtpModule,
    WebsocketModule,
    WebhookModule,
    LlmModule,
    CompanyModule,
    ProxyModule,
    CommsModule,
  ],
  controllers: [AppController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AppService,
    PostHogLogsService,
    {
      provide: APP_FILTER,
      useClass: PostHogExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PostHogUserContextInterceptor,
    },
  ],
})
export class AppModule {}
