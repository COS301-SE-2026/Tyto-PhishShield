import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailDifficulty, Emails } from '../entities/emails.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class BatchEmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(BatchEmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(Emails)
    private readonly emailRepository: Repository<Emails>,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  ////////////////////////////////////////

  async sendBatchWithReference(
    emailReferenceNumber: string,
    recipients: string[],
  ): Promise<{ success: boolean; message: string }> {
    const email =
      await this.emailService.getEmailByReference(emailReferenceNumber);

    const fromString = email.alias
      ? `${email.alias} <${email.sender}>`
      : email.sender;

    const payload = recipients.map((recipient) => ({
      from: fromString,
      to: [recipient],
      subject: email.subject,
      html: email.content,
    }));

    try {
      const { error } = await this.resend.batch.send(payload);

      if (error) {
        this.logger.error(`Resend batch API returned an error`, error);
        throw new InternalServerErrorException(
          error.message ?? 'Resend batch send failed',
        );
      }

      this.logger.log(
        `Batch of ${recipients.length} emails dispatched for reference: ${emailReferenceNumber}`,
      );

      return {
        success: true,
        message: `Email with reference ${emailReferenceNumber} was sent to ${recipients.length} recipient(s).`,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(
        `Failed to dispatch batch for reference ${emailReferenceNumber}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error ? error.message : 'Failed to send batch email';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  ////////////////////////////////

  async sendBatchRandomSameEmail(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
  ): Promise<{ success: boolean; message: string }> {
    if (scheduledTo.getTime() < scheduledFrom.getTime()) {
      throw new BadRequestException(
        'scheduledTo must not be earlier than scheduledFrom',
      );
    }

    const referenceNumber = await this.getRandomEmailByDifficulty(difficulty);

    const sameInstant = scheduledFrom.getTime() === scheduledTo.getTime();
    const useIndependentRandomTimes = randomisedTimes && !sameInstant;

    if (useIndependentRandomTimes) {
      return this.sendWithIndependentRandomTimes(
        referenceNumber,
        recipients,
        scheduledFrom,
        scheduledTo,
      );
    }

    const scheduledAt = sameInstant
      ? scheduledFrom
      : this.randomDateBetween(scheduledFrom, scheduledTo);

    return this.sendBatchAtSameTime(referenceNumber, recipients, scheduledAt);
  }

  private async sendWithIndependentRandomTimes(
    emailReferenceNumber: string,
    recipients: string[],
    scheduledFrom: Date,
    scheduledTo: Date,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await Promise.all(
        recipients.map((recipient) =>
          this.emailService.scheduleSendEmail(
            emailReferenceNumber,
            recipient,
            this.randomDateBetween(scheduledFrom, scheduledTo),
          ),
        ),
      );

      this.logger.log(
        `Scheduled ${recipients.length} emails with independent random times for reference: ${emailReferenceNumber}`,
      );

      return {
        success: true,
        message: `${recipients.length} email(s) scheduled at independent random times between ${scheduledFrom.toISOString()} and ${scheduledTo.toISOString()}.`,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(
        `Failed to schedule randomised times for batch with email template reference: ${emailReferenceNumber}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error
          ? error.message
          : 'Failed to schedule batch emails';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  private async sendBatchAtSameTime(
    referenceNumber: string,
    recipients: string[],
    scheduledAt: Date,
  ): Promise<{ success: boolean; message: string }> {
    const email = await this.emailRepository.findOne({
      where: { referenceNumber },
    });

    if (!email) {
      throw new NotFoundException(
        `Email with reference ${referenceNumber} not found`,
      );
    }

    const fromString = email.alias
      ? `${email.alias} <${email.sender}>`
      : email.sender;

    const nearNow = scheduledAt.getTime() - Date.now() <= 300000;

    const payload = recipients.map((recipient) => ({
      from: fromString,
      to: [recipient],
      subject: email.subject,
      html: email.content,
      ...(nearNow ? {} : { scheduledAt: scheduledAt.toISOString() }),
    }));

    try {
      const { error } = await this.resend.batch.send(payload);

      if (error) {
        this.logger.error(`Resend batch API returned an error`, error);
        throw new InternalServerErrorException(
          error.message ?? 'Resend batch send failed',
        );
      }

      this.logger.log(
        `Batch of ${recipients.length} emails scheduled for ${scheduledAt.toISOString()} with email template reference: ${email.referenceNumber})`,
      );

      return {
        success: true,
        message: `${recipients.length} email(s) scheduled for ${scheduledAt.toISOString()}.`,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(
        `Failed to dispatch batch for reference ${email.referenceNumber}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error ? error.message : 'Failed to send batch email';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  /////////////////////////////////////////

  async sendBatchRandomDifferentEmail(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
  ): Promise<{ success: boolean; message: string }> {
    if (scheduledTo.getTime() < scheduledFrom.getTime()) {
      throw new BadRequestException(
        'scheduledTo must not be earlier than scheduledFrom',
      );
    }

    const sameInstant = scheduledFrom.getTime() === scheduledTo.getTime();
    const useIndependentRandomTimes = randomisedTimes && !sameInstant;

    if (useIndependentRandomTimes) {
      return this.sendWithIndependentRandomTimesRandomEmails(
        recipients,
        difficulty,
        scheduledFrom,
        scheduledTo,
      );
    }

    const scheduledAt = sameInstant
      ? scheduledFrom
      : this.randomDateBetween(scheduledFrom, scheduledTo);

    return this.sendBatchAtSameTimeRandomEmails(
      recipients,
      difficulty,
      scheduledAt,
    );
  }

  private async sendWithIndependentRandomTimesRandomEmails(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const referenceNumberArray = await this.getRandomEmailByDifficultyArray(
        difficulty,
        recipients.length,
      );
      await Promise.all(
        recipients.map((recipient, index) =>
          this.emailService.scheduleSendEmail(
            referenceNumberArray[index % referenceNumberArray.length],
            recipient,
            this.randomDateBetween(scheduledFrom, scheduledTo),
          ),
        ),
      );

      this.logger.log(
        `Scheduled ${recipients.length} emails with independent random times to ${referenceNumberArray.length} different emails`,
      );

      return {
        success: true,
        message: `${recipients.length} email(s) scheduled at independent random times between ${scheduledFrom.toISOString()} and ${scheduledTo.toISOString()}.`,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(`Failed to schedule randomised batch`, error);
      const diagnosticMessage =
        error instanceof Error
          ? error.message
          : 'Failed to schedule batch emails';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  private async sendBatchAtSameTimeRandomEmails(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledAt: Date,
  ): Promise<{ success: boolean; message: string }> {
    const referenceNumberArray = await this.getRandomEmailByDifficultyArray(
      difficulty,
      recipients.length,
    );

    const emails = await this.emailRepository.find({
      where: { referenceNumber: In(referenceNumberArray) },
    });

    const emailsByReference = new Map(
      emails.map((email) => [email.referenceNumber, email]),
    );

    const nearNow = scheduledAt.getTime() - Date.now() <= 300000;

    const payload = recipients.map((recipient, index) => {
      const referenceNumber =
        referenceNumberArray[index % referenceNumberArray.length];
      const email = emailsByReference.get(referenceNumber);

      if (!email) {
        throw new NotFoundException(
          `Email with reference ${referenceNumber} not found`,
        );
      }

      const fromString = email.alias
        ? `${email.alias} <${email.sender}>`
        : email.sender;

      return {
        from: fromString,
        to: [recipient],
        subject: email.subject,
        html: email.content,
        ...(nearNow ? {} : { scheduledAt: scheduledAt.toISOString() }),
      };
    });

    try {
      const { error } = await this.resend.batch.send(payload);

      if (error) {
        this.logger.error(`Resend batch API returned an error`, error);
        throw new InternalServerErrorException(
          error.message ?? 'Resend batch send failed',
        );
      }

      this.logger.log(
        `Batch of ${recipients.length} emails drawn from ${emails.length} different ${difficulty} email(s) scheduled for ${scheduledAt.toISOString()}`,
      );

      return {
        success: true,
        message: `${recipients.length} email(s) scheduled for ${scheduledAt.toISOString()}.`,
      };
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(
        `Failed to dispatch different email templates to batch of difficulty: ${difficulty}`,
        error,
      );
      const diagnosticMessage =
        error instanceof Error ? error.message : 'Failed to send batch email';
      throw new InternalServerErrorException(diagnosticMessage);
    }
  }

  //////////////////////////////////////////////////////

  private randomDateBetween(from: Date, to: Date): Date {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const randomTime = fromTime + Math.random() * (toTime - fromTime);
    return new Date(randomTime);
  }

  async getRandomEmailByDifficulty(
    difficulty: EmailDifficulty,
  ): Promise<string> {
    let email: Emails | null;

    try {
      email = await this.emailRepository
        .createQueryBuilder('email')
        .where('email.difficulty = :difficulty', { difficulty })
        .orderBy('RANDOM()')
        .getOne();
    } catch (error) {
      this.logger.error(
        `Database execution failure when fetching by difficulty: ${difficulty}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch email due to a system error',
      );
    }

    if (!email) {
      this.logger.warn(
        `Lookup missed: no emails found with difficulty: ${difficulty}.`,
      );
      throw new NotFoundException(
        `No emails found with difficulty: ${difficulty}`,
      );
    }
    return email.referenceNumber;
  }

  async getRandomEmailByDifficultyArray(
    difficulty: EmailDifficulty,
    size: number,
  ): Promise<string[]> {
    let emails: Emails[] | null;

    try {
      emails = await this.emailRepository
        .createQueryBuilder('email')
        .where('email.difficulty = :difficulty', { difficulty })
        .orderBy('RANDOM()')
        .limit(size)
        .getMany();
    } catch (error) {
      this.logger.error(
        `Database execution failure when fetching by difficulty: ${difficulty}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch email due to a system error',
      );
    }

    if (!emails) {
      this.logger.warn(
        `Lookup missed: no emails found with difficulty: ${difficulty}.`,
      );
      throw new NotFoundException(
        `No emails found with difficulty: ${difficulty}`,
      );
    }
    return emails.map((email) => email.referenceNumber);
  }
}
