/**
 * AppModule — API Gateway root module.
 *
 * - Configures global configuration and registers backend modules.
 * - Exposes controllers that forward requests to downstream services.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MailingModule } from './mailing/mailing.module';

import { ReportModule } from './report/report.module';
import { EducationModule } from './education/education.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { XpModule } from './xp/xp.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OtpModule } from './otp/otp.module';
import { WebhookModule } from './webhook/webhook.module';
import { WavesModule } from './waves/waves.module';
import { LlmModule } from './llm/llm.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule,
    MailingModule,
    ReportModule,
    XpModule,
    EducationModule,
    AnalyticsModule,
    OtpModule,
    // Register each microservice tcp client to the api-gateway
    ClientsModule.register([
      {
        name: 'ACCOUNTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ACCOUNTS_HOST ?? 'accounts_app',
          port: Number(process.env.ACCOUNTS_TCP_PORT ?? 4001),
        },
      },
      {
        name: 'MAILING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MAILING_HOST ?? 'mailing_app',
          port: Number(process.env.MAILING_TCP_PORT ?? 4002),
        },
      },
      {
        name: 'XP_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.XP_HOST ?? 'xp_app',
          port: Number(process.env.XP_TCP_PORT ?? 4004),
        },
      },
      {
        name: 'REPORT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.REPORT_HOST ?? 'report_app',
          port: Number(process.env.REPORT_TCP_PORT ?? 4003),
        },
      },
      {
        name: 'EDUCATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.EDUCATION_HOST ?? 'education_app',
          port: Number(process.env.EDUCATION_TCP_PORT ?? 4005),
        },
      },
      {
        name: 'ANALYTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_HOST ?? 'analytics_app',
          port: Number(process.env.ANALYTICS_TCP_PORT ?? 4006),
        },
      },
      {
        name: 'LLM_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.LLM_HOST ?? 'llm_app',
          port: Number(process.env.LLM_TCP_PORT ?? 4007),
        },
      },
      {
        name: 'COMPANY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.COMPANY_HOST ?? 'company_app',
          port: Number(process.env.COMPANY_TCP_PORT ?? 4008),
        },
      },
    ]),
    WebsocketModule,
    WebhookModule,
    WavesModule,
    LlmModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AppService,
  ],
})
export class AppModule {}
