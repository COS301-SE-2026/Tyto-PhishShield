import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

interface AuthenticatedRequest extends Request {
  user: {
    auth0Id: string;
    email: string;
    role: string;
  };
}

interface SingleEmailPayload {
  recipient: string;
  referenceNumber: string;
  scheduledAt: string;
}

interface BatchEmailPayload {
  entries: SingleEmailPayload[];
}


@ApiTags('Reports')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}


  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'email.send',
    queue: 'report-service-email-queue',
  })
  async handleSingleSend(payload: SingleEmailPayload): Promise<void> {
    await this.reportService.recordSentEmail(payload);
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'email.send',
    queue: 'report-service-email-queue',
  })
  async handleSingleSchedule(payload: SingleEmailPayload): Promise<void> {
    await this.reportService.recordSentEmail(payload);
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'email.send',
    queue: 'report-service-batch-email-queue',
  })
  async handleBatchSend(@Payload() payload: BatchEmailPayload): Promise<void> {
    for (const entry of payload.entries) {
      await this.reportService.recordSentEmail(entry);
    }
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'email.send',
    queue: 'report-service-batch-email-queue',
  })
  async handleBatchSchedule(@Payload() payload: BatchEmailPayload): Promise<void> {
    for (const entry of payload.entries) {
      await this.reportService.recordSentEmail(entry);
    }
  }


  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a phishing report from the Outlook add-in' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.reportService.create(req.user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin/analyst)' })
  findAll() {
    return this.reportService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reports' })
  getMyReports(@Req() req: AuthenticatedRequest) {
    return this.reportService.findByUser(req.user.auth0Id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific report' })
  findOne(@Param('id') id: string) {
    return this.reportService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the status of a specific report(admin/analyst only)',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.reportService.updateStatus(id, dto);
  }

  @MessagePattern('report.findByUser')
  findByUserTcp(auth0Id: string) {
    return this.reportService.findByUser(auth0Id);
  }

  @MessagePattern('report.findById')
  findByIdTcp(id: string) {
    return this.reportService.findById(id);
  }
}
