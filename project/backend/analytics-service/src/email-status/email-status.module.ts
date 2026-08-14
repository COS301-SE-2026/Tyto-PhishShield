import { Module } from '@nestjs/common';
import { EmailStatusController } from './email-status.controller';
import { EmailStatusService } from './email-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailStatusEntity } from '../entities/email-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailStatusEntity])],
  controllers: [EmailStatusController],
  providers: [EmailStatusService],
})
export class EmailStatusModule {}
