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
import { DeleteResult, Repository } from 'typeorm';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { UserEntity } from '../entities/user.entity';
import { Resend } from 'resend';
import { EmailsDto } from '../dto/emails.dto';
import * as crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { VariableResolverService } from '../shared-services/variable-resolver.service';
import { TrackingLinkService } from '../shared-services/tracking-link.service';
import { SenderResolverService } from '../shared-services/sender-resolver.service';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(EmailTemplateEntity)
    private readonly emailTemplateRepository: Repository<EmailTemplateEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeInfoEntity)
    private readonly employeeInfoRepository: Repository<EmployeeInfoEntity>,
    private readonly amqpConnection: AmqpConnection,
    private readonly variableResolver: VariableResolverService,
    private readonly senderResolver: SenderResolverService,
    private readonly trackingLinkService: TrackingLinkService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async createEmail(dto: EmailsDto): Promise<EmailTemplateEntity> {
    try {
      const uniqueHash = crypto.randomBytes(4).toString('hex').toUpperCase();
      const generatedReference = `PHISH-${uniqueHash}`;

      const newEmail = this.emailTemplateRepository.create({
        ...dto,
        referenceNumber: generatedReference,
      });

      const savedEmail = await this.emailTemplateRepository.save(newEmail);
      this.logger.log(
        `Email successfully created with reference: ${generatedReference}`,
      );
      return savedEmail;
    } catch (error) {
      this.logger.error(`Failed to create email`, error);
      throw new InternalServerErrorException('Failed to create email');
    }
  }

  async getAllEmails(): Promise<EmailTemplateEntity[]> {
    try {
      return await this.emailTemplateRepository.find();
    } catch (error) {
      this.logger.error('Failed to fetch emails', error);
      throw new InternalServerErrorException(
        'Failed to retrieve emails from database.',
      );
    }
  }

  async getEmailByReference(
    referenceNumber: string,
  ): Promise<EmailTemplateEntity> {
    if (!referenceNumber) {
      throw new NotFoundException('Reference number is required');
    }

    let email: EmailTemplateEntity | null;

    try {
      email = await this.emailTemplateRepository.findOne({
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
  ): Promise<EmailTemplateEntity> {
    const email = await this.getEmailByReference(referenceNumber);
    Object.assign(email, dto);

    try {
      const updatedEmail = await this.emailTemplateRepository.save(email);
      this.logger.log(`Email data updated for reference: ${referenceNumber}`);
      return updatedEmail;
    } catch (error) {
      this.logger.error('Failed to update email data', error);
      throw new InternalServerErrorException('Failed to update email data');
    }
  }

  async deleteEmail(referenceNumber: string): Promise<DeleteResult> {
    try {
      const entry = await this.emailTemplateRepository.delete({
        referenceNumber: referenceNumber,
      });

      if (entry.affected === 0) {
        throw new NotFoundException(
          `Email template with referenceNumber: ${referenceNumber} not found`,
        );
      }

      return entry;
    } catch (error) {
      this.logger.error(
        `Failed to delete email with reference number: ${referenceNumber}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to delete email with reference number: ${referenceNumber}`,
      );
    }
  }

  // Helper Function to load all necessary user info.
  private async loadUserAndEmployeeInfo(
    auth0Id: string,
  ): Promise<{ user: UserEntity; employeeInfo?: EmployeeInfoEntity }> {
    const user = await this.userRepository.findOne({ where: { auth0Id } });

    if (!user) {
      this.logger.error(`User: ${auth0Id}, not found in db.`);
      throw new NotFoundException(`User: ${auth0Id}, not found in db.`);
    }

    const employeeInfo = await this.employeeInfoRepository.findOne({
      where: { auth0Id },
    });

    return { user, employeeInfo: employeeInfo ?? undefined };
  }

  // Helper Function to prepare email content.
  private async prepareDispatch(
    referenceNumber: string,
    auth0Id: string,
    user: UserEntity,
    employeeInfo?: EmployeeInfoEntity,
    senderCustomName?: string,
    senderAuth0Id?: string,
    alias?: string,
  ): Promise<{
    subject: string;
    content: string;
    token: string;
    fromString: string;
  }> {
    const email = await this.getEmailByReference(referenceNumber);

    const subject = this.variableResolver.substitute(
      email.subject,
      referenceNumber,
      user,
      employeeInfo,
    );

    const substitutedContent = this.variableResolver.substitute(
      email.content,
      referenceNumber,
      user,
      employeeInfo,
    );

    const { content, token } =
      this.trackingLinkService.replace(substitutedContent);

    const fromString = await this.senderResolver.resolveFromAddress(
      email,
      auth0Id,
      senderCustomName,
      senderAuth0Id,
      alias,
    );

    return { subject, content, token, fromString };
  }

  // Helper Function to publish event on event exchange
  private async publishMailingEvent(
    routingKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'mailing-event-exchange',
        routingKey,
        payload,
      );
    } catch (publishError) {
      this.logger.error(`Failed to publish ${routingKey}`, publishError);
    }
  }

  async sendEmail(
    referenceNumber: string,
    auth0Id: string,
    senderCustomName?: string,
    senderAuth0Id?: string,
    alias?: string,
  ): Promise<{ success: boolean; message: string; deliveryId: string }> {
    try {
      const { user, employeeInfo } =
        await this.loadUserAndEmployeeInfo(auth0Id);

      const { subject, content, token, fromString } =
        await this.prepareDispatch(
          referenceNumber,
          auth0Id,
          user,
          employeeInfo,
          senderCustomName,
          senderAuth0Id,
          alias,
        );

      const { data, error } = await this.resend.emails.send({
        from: fromString,
        to: user.email,
        subject,
        html: content,
      });

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      this.logger.log(`Email successfully dispatched from ${fromString}`);

      await this.publishMailingEvent('mailing.send', {
        emailId: data.id,
        recipient: user.email,
        referenceNumber,
        scheduledAt: new Date().toISOString(),
        auth0Id,
        token,
      });

      return {
        success: true,
        message: `Email with referencing number: ${referenceNumber}, sent instantly.`,
        deliveryId: data.id || '',
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
    referenceNumber: string,
    auth0Id: string,
    scheduledAt: Date,
    senderCustomName?: string,
    senderAuth0Id?: string,
    alias?: string,
  ): Promise<{ success: boolean; message: string; deliveryId: string }> {
    try {
      const { user, employeeInfo } =
        await this.loadUserAndEmployeeInfo(auth0Id);

      const { subject, content, token, fromString } =
        await this.prepareDispatch(
          referenceNumber,
          auth0Id,
          user,
          employeeInfo,
          senderCustomName,
          senderAuth0Id,
          alias,
        );

      const { data, error } = await this.resend.emails.send({
        from: fromString,
        to: user.email,
        subject,
        html: content,
        scheduledAt: scheduledAt.toISOString(),
      });

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      this.logger.log(
        `Email successfully scheduled for dispatch at ${scheduledAt.toISOString()}`,
      );

      await this.publishMailingEvent('mailing.schedule', {
        emailId: data.id,
        referenceNumber,
        recipient: user.email,
        scheduledAt: scheduledAt.toISOString(),
        auth0Id,
        token,
      });

      return {
        success: true,
        message: `Email referencing ${referenceNumber} has been successfully scheduled for ${scheduledAt.toISOString()}`,
        deliveryId: data.id || '',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule email referencing ${referenceNumber}`,
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
