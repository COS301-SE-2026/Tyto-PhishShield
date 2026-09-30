/**
 * Service: mailing-service
 *
 * Handles incoming HTTP requests for single email operations.
 * Exposes REST endpoints for creating, retrieving, updating,
 * sending, and scheduling individual emails.
 *
 * Functions:
 * - {@link EmailController#createEmail} - Creates a new email record in the database.
 * - {@link EmailController#getAllEmails} - Returns all email records from the database.
 * - {@link EmailController#getEmailByReference} - Returns a single email by its reference number.
 * - {@link EmailController#updateEmail} - Updates fields on an existing email record.
 * - {@link EmailController#sendEmail} - Immediately dispatches an email to a recipient via Resend.
 * - {@link EmailController#scheduleSendEmail} - Schedules an email to be sent at a future date/time.
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Patch,
  Delete,
  NotFoundException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import {
  EmailsDto,
  SendReplyEmailEvent,
  SendSpearPhishingEvent,
} from '@phishshield/dto';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { ScheduleSingleEmailDto } from '@phishshield/dto';
import { MailingPostReturnDto } from '../dto/mailing-post-return.dto';
import { SendSingleEmailDto } from '@phishshield/dto';
import { DeleteResult } from 'typeorm';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ScheduleResolverService } from '../shared-services/schedule-resolver.service';

@Controller('emails')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly scheduleResolver: ScheduleResolverService,
  ) {}

  @RabbitSubscribe({
    exchange: 'llm-event-exchange',
    routingKey: 'reply.email',
    queue: 'mailing-queue',
  })
  async handleSendReply(event: SendReplyEmailEvent): Promise<void> {
    try {
      await this.emailService.handleSendReply(event);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnprocessableEntityException
      ) {
        this.logger.warn(`Dropping reply.email event: ${error.message}`);
        return;
      }
    }
  }

  @Post()
  async createEmail(
    @Body() createEmailDto: EmailsDto,
  ): Promise<EmailTemplateEntity> {
    return this.emailService.createEmail(createEmailDto);
  }

  @Get()
  async getAllEmails(): Promise<EmailTemplateEntity[]> {
    return this.emailService.getAllEmails();
  }

  @Get(':referenceNumber')
  async getEmailByReference(
    @Param('referenceNumber') referenceNumber: string,
  ): Promise<EmailTemplateEntity> {
    return this.emailService.getEmailByReference(referenceNumber);
  }

  @Patch(':referenceNumber')
  async updateEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body() updateEmailDto: Partial<EmailsDto>,
  ): Promise<EmailTemplateEntity> {
    return this.emailService.updateEmail(referenceNumber, updateEmailDto);
  }

  @Delete(':referenceNumber')
  async deleteEmail(
    @Param('referenceNumber') referenceNumber: string,
  ): Promise<DeleteResult> {
    return this.emailService.deleteEmail(referenceNumber);
  }

  @Post(':referenceNumber/send-single')
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Param('referenceNumber') emailReferenceNumber: string,
    @Body() sendSingleEmailDto: SendSingleEmailDto,
  ): Promise<MailingPostReturnDto> {
    const result = await this.emailService.sendEmail(
      emailReferenceNumber,
      sendSingleEmailDto.auth0Id,
      sendSingleEmailDto.senderCustomName,
      sendSingleEmailDto.senderAuth0Id,
      sendSingleEmailDto.alias,
    );

    return new MailingPostReturnDto({
      success: result.success,
      message: result.message,
      deliveryId: result.deliveryId,
    });
  }

  @Post(':referenceNumber/schedule-send-single')
  @HttpCode(HttpStatus.OK)
  async scheduleSendEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body() scheduledSingleEmailDto: ScheduleSingleEmailDto,
  ): Promise<MailingPostReturnDto> {
    const result = await this.emailService.scheduleSendEmail(
      referenceNumber,
      scheduledSingleEmailDto.auth0Id,
      scheduledSingleEmailDto.scheduledAt,
      scheduledSingleEmailDto.senderCustomName,
      scheduledSingleEmailDto.senderAuth0Id,
      scheduledSingleEmailDto.alias,
    );

    return new MailingPostReturnDto({
      success: result.success,
      message: result.message,
      deliveryId: result.deliveryId,
    });
  }

  @RabbitSubscribe({
    exchange: 'llm-event-exchange',
    routingKey: 'spear-phishing.email',
    queue: 'mailing-spear-phishing-queue',
  })
  async handleSpearPhishingEvent(event: SendSpearPhishingEvent): Promise<void> {
    this.logger.log(
      `Received spear-phishing event for recipient ${event.recipientAuth0Id}`,
    );

    try {
      const decision = this.scheduleResolver.resolve(
        event.scheduledFrom ? new Date(event.scheduledFrom) : undefined,
        event.scheduledTo ? new Date(event.scheduledTo) : undefined,
      );

      if (decision.instant) {
        this.logger.log(
          `Schedule window invalid/too close for recipient ${event.recipientAuth0Id}, sending instantly`,
        );
      }

      await this.emailService.scheduleSpearPhishingEmail(
        event.recipientAuth0Id,
        event.senderAuth0Id,
        event.subject,
        event.content,
        decision.instant ? new Date(Date.now() + 60_000) : decision.scheduledAt,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle spear-phishing event for recipient ${event.recipientAuth0Id}`,
        error,
      );
    }
  }
}
