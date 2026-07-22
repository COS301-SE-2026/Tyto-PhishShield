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
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([Emails]),
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'mailing-event-exchange',
          type: 'topic',
        },
      ],
    }),
  ],
  controllers: [BatchEmailController],
  providers: [BatchEmailService],
})
export class BatchEmailModule {}
