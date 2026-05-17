import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SendEmailService } from './send-email.service';
import { SendEmailDto } from '../dto/send-email.dto';

@Controller('send-mail')
export class SendEmailController {
  constructor(private readonly sendMailService: SendEmailService) {}

  @Post('send-single-email')
  @HttpCode(HttpStatus.OK)
  async sendSingleEmail(@Body() sendMailDto: SendEmailDto) {
    return this.sendMailService.sendSingleEmail(sendMailDto);
  }
}
