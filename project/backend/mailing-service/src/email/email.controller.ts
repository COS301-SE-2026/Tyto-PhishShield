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
} from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailsDto } from '../dto/emails.dto';
import { Emails } from '../entities/emails.entity';
import { ScheduleSingleEmailDto } from '../dto/schedule-single-email.dto';
import { MailingPostReturnDto } from '../dto/mailing-post-return.dto';
import { SendSingleEmailDto } from '../dto/send-single-email.dto';

@Controller('emails')
export class EmailController {
  constructor(private readonly sendMailService: EmailService) {}

  @Post()
  async createEmail(@Body() createEmailDto: EmailsDto): Promise<Emails> {
    return this.sendMailService.createEmail(createEmailDto);
  }

  @Get()
  async getAllEmails(): Promise<Emails[]> {
    return this.sendMailService.getAllEmails();
  }

  @Get(':referenceNumber')
  async getEmailByReference(
    @Param('referenceNumber') referenceNumber: string,
  ): Promise<Emails> {
    return this.sendMailService.getEmailByReference(referenceNumber);
  }

  @Patch(':referenceNumber')
  async updateEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body() updateEmailDto: Partial<EmailsDto>,
  ): Promise<Emails> {
    return this.sendMailService.updateEmail(referenceNumber, updateEmailDto);
  }

  @Post(':referenceNumber/send-single')
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Param('referenceNumber') emailReferenceNumber: string, //using reference number in parameter
    @Body() sendSingleEmailDto: SendSingleEmailDto,
  ): Promise<MailingPostReturnDto> {
    const result = await this.sendMailService.sendEmail(
      emailReferenceNumber,
      // sendSingleEmailDto.auth0Id,
      sendSingleEmailDto.recipient,
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
    const result = await this.sendMailService.scheduleSendEmail(
      referenceNumber,
      scheduledSingleEmailDto.recipient,
      scheduledSingleEmailDto.scheduledAt,
    );

    return new MailingPostReturnDto({
      success: result.success,
      message: result.message,
      deliveryId: result.deliveryId,
    });
  }
}
