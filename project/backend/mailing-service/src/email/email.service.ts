// src/send-mail/email.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedEmail } from '../entities/generated-emails.entity';
import { Resend, CreateEmailResponse } from 'resend';
import { GenerateEmailDto } from '../dto/generate-email.dto';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(GeneratedEmail)
    private readonly emailRepository: Repository<GeneratedEmail>,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async createEmail(dto: GenerateEmailDto): Promise<GeneratedEmail> {
    const newEmail = this.emailRepository.create(dto);
    return this.emailRepository.save(newEmail);
  }

  async getAllEmails(): Promise<GeneratedEmail[]> {
    return this.emailRepository.find();
  }

  async getEmailByReference(referenceNumber: string): Promise<GeneratedEmail> {
    const email = await this.emailRepository.findOne({
      where: { reference_number: referenceNumber },
    });

    if (!email) {
      throw new NotFoundException(
        `Email with reference ${referenceNumber} not found`,
      );
    }

    return email;
  }

  async updateEmail(
    referenceNumber: string,
    dto: Partial<GenerateEmailDto>,
  ): Promise<GeneratedEmail> {
    const email = await this.getEmailByReference(referenceNumber);
    Object.assign(email, dto);
    return this.emailRepository.save(email);
  }

  async sendEmail(
    referenceNumber: string,
  ): Promise<{ success: boolean; message: string; data: CreateEmailResponse }> {
    const email = await this.getEmailByReference(referenceNumber);

    const fromString = email.alias
      ? `${email.alias} <${email.sender}>`
      : email.sender;

    try {
      const data = await this.resend.emails.send({
        from: fromString,
        to: email.recipient,
        subject: email.subject,
        html: email.content,
      });

      this.logger.log(
        `Email successfully dispatched from ${email.sender} to ${email.recipient}`,
      );
      return { success: true, message: 'Email sent successfully', data };
    } catch (error) {
      this.logger.error(`Failed to send email to ${email.recipient}`, error);
      throw new InternalServerErrorException(
        'Failed to process email dispatch',
      );
    }
  }
}
