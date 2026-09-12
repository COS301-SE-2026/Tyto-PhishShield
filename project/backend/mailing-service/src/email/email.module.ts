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
import { mailingRabbitMQModule } from '../rabbitmq.module';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { UserEntity } from '../entities/user.entity';
import { VariableResolverService } from '../shared-services/variable-resolver.service';
import { SenderResolverService } from '../shared-services/sender-resolver.service';
import { TrackingLinkService } from '../shared-services/tracking-link.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplateEntity, UserEntity]),
    mailingRabbitMQModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    VariableResolverService,
    SenderResolverService,
    TrackingLinkService,
  ],
  exports: [
    EmailService,
    VariableResolverService,
    SenderResolverService,
    TrackingLinkService,
  ],
})
export class EmailModule {}
