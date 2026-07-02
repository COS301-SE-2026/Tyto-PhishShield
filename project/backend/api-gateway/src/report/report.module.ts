import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { ReportController } from './report.controller';

@Module({
  imports: [ProxyModule],
  controllers: [ReportController],
})
export class ReportModule {}
