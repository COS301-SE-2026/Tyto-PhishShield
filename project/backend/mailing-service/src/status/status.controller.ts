import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StatusService } from './status.service';
import { EmailStatusEntity } from '../entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post('create')
  async createStatus(
    @Body() body: StatusCreateDto,
  ): Promise<EmailStatusEntity> {
    return this.statusService.createStatus(body);
  }

  @Get(':auth0id')
  async getStatus(
    @Param('auth0id') auth0Id: string,
  ): Promise<EmailStatusEntity[]> {
    return this.statusService.getStatus(auth0Id);
  }

  @Delete(':id')
  async deleteStatus(
    @Param('emailId') emailId: string,
  ): Promise<EmailStatusEntity> {
    return this.statusService.deleteStatus(emailId);
  }
}
