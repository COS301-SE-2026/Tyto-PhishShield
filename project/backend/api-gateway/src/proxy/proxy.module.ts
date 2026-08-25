/**
 * ProxyModule — proxy helpers for forwarding requests.
 *
 * - Groups proxy-related services used to route or transform requests to downstream services.
 */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { RouteResolver } from './proxy.routes';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [HttpModule, ConfigModule, 
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
  ],
  providers: [ProxyService, RouteResolver],
  exports: [ProxyService, RouteResolver],
})
export class ProxyModule {}
