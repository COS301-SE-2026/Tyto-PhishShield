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

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ProxyService, RouteResolver],
  exports: [ProxyService, RouteResolver],
})
export class ProxyModule {}
