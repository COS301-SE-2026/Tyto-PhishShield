/**
 * Service: mailing-service
 *
 * Declares and wires together the components for batch email operations.
 * Imports EmailModule to access EmailService, registers BatchEmailController
 * and BatchEmailService, and provides the Emails TypeORM entity.
 */

import { Module } from '@nestjs/common';
import { BatchEmailController } from './batch-email.controller';
import { BatchEmailService } from './batch-email.service';
import { EmailModule } from '../email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emails } from '../entities/emails.entity';
import { EmailService } from '../email/email.service';

@Module({
  imports: [EmailModule, TypeOrmModule.forFeature([Emails])],
  controllers: [BatchEmailController],
  providers: [BatchEmailService, EmailService],
})
export class BatchEmailModule {}
