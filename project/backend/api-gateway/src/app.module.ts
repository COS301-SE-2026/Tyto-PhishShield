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
import { EducationModule} from './education/education.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule,
    MailingModule,
    ReportModule,
    EducationModule,
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
          port: Number(process.env.EDUCATION_TCP_PORT ?? 4004),
        },
      },
      {
        name: 'ANALYTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_HOST ?? 'analytics_app',
          port: Number(process.env.ANALYTICS_TCP_PORT ?? 4005),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
