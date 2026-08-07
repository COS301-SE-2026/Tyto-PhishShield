import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EmailStatusService } from './email-status.service';
import { EmailStatusEntity } from '../entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';

@Controller('email-status')
export class EmailStatusController {
  constructor(private readonly emailStatusService: EmailStatusService) {}

  @Post('create')
  async createStatus(
    @Body() body: StatusCreateDto,
  ): Promise<EmailStatusEntity> {
    return this.emailStatusService.createStatus(body);
  }

  @Get(':auth0id')
  async getStatus(
    @Param('auth0id') auth0Id: string,
  ): Promise<EmailStatusEntity[]> {
    return this.emailStatusService.getStatus(auth0Id);
  }

  @Delete(':emailId')
  async deleteStatus(
    @Param('emailId') emailId: string,
  ): Promise<EmailStatusEntity> {
    return this.emailStatusService.deleteStatus(emailId);
  }
}
