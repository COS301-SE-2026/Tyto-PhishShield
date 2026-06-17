import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Emails } from '../entities/emails.entity';
import { Repository } from 'typeorm';

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

  async sendBatchWithReference(
    emailReferenceNumber: string,
    recipients: string[],
  ): Promise<{ success: boolean; message: string }> {
    const email =
      await this.emailService.getEmailByReference(emailReferenceNumber);

    const fromString = email.alias
      ? '${email.alias} <${email.sender}>'
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
}
