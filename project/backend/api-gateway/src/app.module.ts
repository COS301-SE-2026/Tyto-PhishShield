import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailingController } from './mailing/mailing.controller';
import { MailingModule } from './mailing/mailing.module';
import { ReportController } from './report/report.controller';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule,
    MailingModule,
    ReportModule,
  ],
  controllers: [AppController, MailingController, ReportController],
  providers: [AppService],
})
export class AppModule {}
