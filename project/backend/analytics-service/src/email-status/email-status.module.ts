import { Module } from '@nestjs/common';
import { EmailStatusController } from './email-status.controller';
import { EmailStatusService } from './email-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailStatusEntity } from './entities/email-status.entity';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailStatusEntity]), AnalyticsModule],
  controllers: [EmailStatusController],
  providers: [EmailStatusService],
})
export class EmailStatusModule {}
