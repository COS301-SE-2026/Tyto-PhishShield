/**
 * Service: waves-service
 *
 * Declares and wires together the components for batch email operations.
 * Imports EmailModule to access EmailService, registers BatchEmailController
 * and BatchEmailService, and provides the Emails TypeORM entity.
 */

import { Module } from '@nestjs/common';
import { BatchEmailController } from './batch-email.controller';
import { BatchEmailService } from './batch-email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { mailingRabbitMQModule } from '../rabbitmq.module';
import { UserEntity } from '../entities/user.entity';
import { WaveModule } from '../wave/wave.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplateEntity, UserEntity]),
    mailingRabbitMQModule,
    WaveModule,
  ],
  controllers: [BatchEmailController],
  providers: [BatchEmailService],
})
export class BatchEmailModule {}
