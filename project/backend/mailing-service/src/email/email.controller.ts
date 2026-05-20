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
import { GenerateEmailDto } from '../dto/generate-email.dto';
import { GeneratedEmail } from '../entities/generated-emails.entity';
import { CreateEmailResponse } from 'resend';

@Controller('emails')
export class EmailController {
  constructor(private readonly sendMailService: EmailService) {}

  @Post()
  async createEmail(
    @Body() createEmailDto: GenerateEmailDto,
  ): Promise<GeneratedEmail> {
    return this.sendMailService.createEmail(createEmailDto);
  }

  @Get()
  async getAllEmails(): Promise<GeneratedEmail[]> {
    return this.sendMailService.getAllEmails();
  }

  @Get(':referenceNumber')
  async getEmailByReference(
    @Param('referenceNumber') referenceNumber: string,
  ): Promise<GeneratedEmail> {
    return this.sendMailService.getEmailByReference(referenceNumber);
  }

  @Patch(':referenceNumber')
  async updateEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body() updateEmailDto: Partial<GenerateEmailDto>,
  ): Promise<GeneratedEmail> {
    return this.sendMailService.updateEmail(referenceNumber, updateEmailDto);
  }

  @Post(':referenceNumber/send-single')
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Param('referenceNumber') referenceNumber: string,
  ): Promise<{ success: boolean; message: string; data: CreateEmailResponse }> {
    return this.sendMailService.sendEmail(referenceNumber);
  }
}
