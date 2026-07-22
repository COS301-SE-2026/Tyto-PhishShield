/**
 * Service: mailing-service
 *
 * Contains the business logic for single email operations.
 * Manages email records in the database and dispatches or schedules
 * individual emails through the Resend API.
 *
 * Functions:
 * - {@link EmailService#createEmail} - Generates a unique PHISH reference number and saves a new email record.
 * - {@link EmailService#getAllEmails} - Fetches all email records from the database.
 * - {@link EmailService#getEmailByReference} - Looks up a single email record by its reference number.
 * - {@link EmailService#updateEmail} - Applies partial updates to an existing email record.
 * - {@link EmailService#sendEmail} - Immediately sends an email to a recipient via the Resend API.
 * - {@link EmailService#scheduleSendEmail} - Schedules an email for delivery at a specified future date/time via Resend.
 */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emails } from '../entities/emails.entity';
import { Resend } from 'resend';
import { EmailsDto } from '../dto/emails.dto';
import * as crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Emails)
    private readonly emailRepository: Repository<Emails>,
    private readonly amqpConnection: AmqpConnection,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async createEmail(dto: EmailsDto): Promise<Emails> {
    try {
      const uniqueHash = crypto.randomBytes(4).toString('hex').toUpperCase();
      const generatedReference = `PHISH-${uniqueHash}`;

      const newEmail = this.emailRepository.create({
        ...dto,
        referenceNumber: generatedReference,
      });

      const savedEmail = await this.emailRepository.save(newEmail);
      this.logger.log(
        `Email successfully created with reference: ${generatedReference}`,
      );
      return savedEmail;
    } catch (error) {
      this.logger.error(`Failed to create email`, error);
      throw new InternalServerErrorException('Failed to create email');
    }
  }

  async getAllEmails(): Promise<Emails[]> {
    try {
      return await this.emailRepository.find();
    } catch (error) {
      this.logger.error('Failed to fetch emails', error);
      throw new InternalServerErrorException(
        'Failed to retrieve emails from database.',
      );
    }
  }

  async getEmailByReference(referenceNumber: string): Promise<Emails> {
    if (!referenceNumber) {
      throw new NotFoundException('Reference number is required');
    }

    let email: Emails | null;

    try {
      email = await this.emailRepository.findOne({
        where: { referenceNumber: referenceNumber },
      });
    } catch (error) {
      this.logger.error(
        `Database execution failure when fetching reference: ${referenceNumber}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch email due to a system error',
      );
    }

    if (!email) {
      this.logger.warn(
        `Lookup missed: Reference code ${referenceNumber} does not exist.`,
      );
      throw new NotFoundException(
        `Email with reference ${referenceNumber} not found`,
      );
    }
    return email;
  }

  async updateEmail(
    referenceNumber: string,
    dto: Partial<EmailsDto>,
  ): Promise<Emails> {
    const email = await this.getEmailByReference(referenceNumber);
    Object.assign(email, dto);

    try {
      const updatedEmail = await this.emailRepository.save(email);
      this.logger.log(`Email data updated for reference: ${referenceNumber}`);
      return updatedEmail;
    } catch (error) {
      this.logger.error('Failed to update email data', error);
      throw new InternalServerErrorException('Failed to update email data');
    }
  }

  async sendEmail(
    referenceNumber: string,
    recipient: string,
  ): Promise<{ success: boolean; message: string; deliveryId: string }> {
    const email = await this.getEmailByReference(referenceNumber);

    const fromString = email.alias
      ? `${email.alias} <${email.sender}>`
      : email.sender;

    try {
      const data = await this.resend.emails.send({
        from: fromString,
        to: recipient,
        subject: email.subject,
        html: email.content,
      });

      this.logger.log(`Email successfully dispatched from ${email.sender}`);

      try {
        const date = new Date();
        await this.amqpConnection.publish(
          'mailing-event-exchange',
          'mailing.send',
          {
            recipient: recipient,
            referenceNumber: referenceNumber,
            scheduledAt: date.toISOString(),
          },
        );
      } catch (publishError) {
        this.logger.error(`Failed to publish email.send`, publishError);
      }
      return {
        success: true,
        message: `Email with referencing number: ${referenceNumber}, sent instantly.`,
        deliveryId: data.data?.id || '',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email referencing ${referenceNumber}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error ? error.message : 'Failed to send email';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  async scheduleSendEmail(
    emailReferenceNumber: string,
    recipient: string,
    scheduledAt: Date,
  ): Promise<{ success: boolean; message: string; deliveryId: string }> {
    const email = await this.getEmailByReference(emailReferenceNumber);

    const fromString = email.alias
      ? `${email.alias} <${email.sender}>`
      : email.sender;

    try {
      const data = await this.resend.emails.send({
        from: fromString,
        to: recipient,
        subject: email.subject,
        html: email.content,
        scheduledAt: scheduledAt.toISOString(),
      });

      this.logger.log(
        `Email successfully scheduled for dispatch at ${scheduledAt.toISOString()}`,
      );

      try {
        await this.amqpConnection.publish(
          'mailing-event-exchange',
          'mailing.schedule',
          {
            referenceNumber: emailReferenceNumber,
            recipient: recipient,
            scheduledAt: scheduledAt.toISOString(),
          },
        );
      } catch (publishError) {
        this.logger.error(`Failed to publish email.schedule`, publishError);
      }

      return {
        success: true,
        message: `Email referencing ${emailReferenceNumber} has been successfully scheduled for ${scheduledAt.toISOString()}`,
        deliveryId: data.data?.id || '',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule email referencing ${emailReferenceNumber}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process email scheduling';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }
}
