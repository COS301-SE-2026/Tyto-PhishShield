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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule,
    MailingModule,
    ReportModule,
    ClientsModule.register([
      {
        name: 'XP_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.XP_SERVICE_HOST ?? 'xp_app',
          port: Number(process.env.XP_TCP_PORT ?? 3000),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
