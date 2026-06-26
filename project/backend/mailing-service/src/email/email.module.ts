/**
 * Service: mailing-service
 *
 * Declares and wires together the components for single email operations.
 * Registers EmailController, EmailService, and the Emails TypeORM entity,
 * and exports EmailService for use in other modules.
 */

import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emails } from '../entities/emails.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Emails])],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
