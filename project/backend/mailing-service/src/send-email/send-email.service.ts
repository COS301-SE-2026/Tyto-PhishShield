// src/send-mail/send-email.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailDto } from '../dto/send-email.dto';

@Injectable()
export class SendEmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(SendEmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendSingleEmail(sendMailDto: SendEmailDto) {
    const { sender, receiver, subject, content } = sendMailDto;

    try {
      const data = await this.resend.emails.send({
        from: sender,
        to: receiver,
        subject: subject,
        html: content,
      });

      this.logger.log(
        `Email successfully dispatched from ${sender} to ${receiver}`,
      );
      return { success: true, message: 'Email sent successfully', data };
    } catch (error) {
      this.logger.error(`Failed to send email to ${receiver}`, error);
      throw new InternalServerErrorException(
        'Failed to process email dispatch',
      );
    }
  }
}
