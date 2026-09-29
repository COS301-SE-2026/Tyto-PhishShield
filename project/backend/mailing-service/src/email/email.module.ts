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
import { SenderResolverService } from '../sender-resolver/sender-resolver.service';
import { TrackingLinkService } from '../shared-services/tracking-link.service';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConnectionEntity } from '../entities/connection.entity';
import { ScheduleResolverService } from '../shared-services/schedule-resolver.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplateEntity,
      UserEntity,
      EmployeeInfoEntity,
      ConnectionEntity,
    ]),
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'llm-event-exchange',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: {
        wait: false,
      },
    }),
    mailingRabbitMQModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    VariableResolverService,
    SenderResolverService,
    TrackingLinkService,
    ScheduleResolverService,
  ],
  exports: [EmailService, VariableResolverService, TrackingLinkService],
})
export class EmailModule {}
