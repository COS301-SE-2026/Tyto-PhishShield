import { Module } from '@nestjs/common';
import { BatchEmailController } from './batch-email.controller';
import { BatchEmailService } from './batch-email.service';
import { EmailModule } from '../email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedEmail } from '../entities/generated-emails.entity';

@Module({
  imports: [EmailModule, TypeOrmModule.forFeature([GeneratedEmail])],
  controllers: [BatchEmailController],
  providers: [BatchEmailService],
})
export class BatchEmailModule {}
