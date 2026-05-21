import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [ProxyModule],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
