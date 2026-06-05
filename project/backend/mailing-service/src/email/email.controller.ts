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
import { ScheduleSingleEmailDto } from '../dto/schedule-single-email.dto';
import { MailingPostReturnDto } from '../dto/mailing-post-return.dto';
import { SendSingleEmailDto } from '../dto/send-single-email.dto';

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
    @Body() sendSingleEmailDto: SendSingleEmailDto,
  ): Promise<MailingPostReturnDto> {
    const result = await this.sendMailService.sendEmail(
      sendSingleEmailDto.emailReferenceNumber,
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
    @Body() scheduledSingleEmailDto: ScheduleSingleEmailDto,
  ): Promise<MailingPostReturnDto> {
    const result = await this.sendMailService.scheduleSendEmail(
      scheduledSingleEmailDto.emailReferenceNumber,
      // scheduledSingleEmailDto.auth0Id,
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
