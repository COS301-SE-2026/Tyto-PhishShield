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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule,
    MailingModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
