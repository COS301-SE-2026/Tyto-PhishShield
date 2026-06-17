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
