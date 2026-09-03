import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
