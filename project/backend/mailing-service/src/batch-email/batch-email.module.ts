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
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { mailingRabbitMQModule } from '../rabbitmq.module';
import { UserEntity } from '../entities/user.entity';
import { WaveModule } from '../wave/wave.module';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';
import { ConnectionEntity } from '../entities/connection.entity';
import { SenderResolverService } from '../sender-resolver/sender-resolver.service';

@Module({
  imports: [
    EmailModule,
    WaveModule,
    TypeOrmModule.forFeature([
      EmailTemplateEntity,
      UserEntity,
      EmployeeInfoEntity,
      ConnectionEntity,
    ]),
    mailingRabbitMQModule,
  ],
  controllers: [BatchEmailController],
  providers: [BatchEmailService, SenderResolverService],
})
export class BatchEmailModule {}
