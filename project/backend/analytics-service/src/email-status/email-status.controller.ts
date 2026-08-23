import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EmailStatusService } from './email-status.service';
import { EmailStatusEntity } from './entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { EmailStatusEnum } from './entities/email-status.entity';

@Controller('email-status')
export class EmailStatusController {
  constructor(
    private readonly emailStatusService: EmailStatusService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('create')
  async createStatus(@Body() body: StatusCreateDto) {
    const saved = await this.emailStatusService.createStatus(body);
    if (body.status === EmailStatusEnum.CLICKED) {
      await this.analyticsService.recordClickFromEmailId(body.emailId);
    }
    return saved;
  }

  @Get(':emailId/get')
  async getStatus(
    @Param('emailId') emailId: string,
  ): Promise<EmailStatusEntity[]> {
    return this.emailStatusService.getStatus(emailId);
  }

  @Delete(':emailId/delete')
  async deleteStatus(
    @Param('emailId') emailId: string,
  ): Promise<EmailStatusEntity> {
    return this.emailStatusService.deleteStatus(emailId);
  }
}
