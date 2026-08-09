import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { RabbitSubscribe, Payload } from '@golevelup/nestjs-rabbitmq';
import { MessagePattern } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventType } from './entities/analytics-event.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

//payload shapes, could move to shared types later, but for now just here.

interface ReportCreatedPayload {
    auth0Id: string;
    email?: string;
    reportId: string;
}

interface XpPayload {
    auth0Id: string;
    amount: number;
    reason?: string;
}

interface EducationPayload {
    auth0Id: string;
    email?: string;
    assignmentId?: string;
    reportId?: string;
}

interface MailingPayload {
    referenceNumber?: string;
    recipient?: string;
    scheduledAt?: string;
    entries?: { referenceNumber: string; recipient: string } [];
}

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @RabbitSubscribe({
        exchange: 'report-event-exchange',
        routingKey: 'report.submitted',
        queue: 'analytics-report-submitted-queue',
    })
    async onReportSubmitted(payload: ReportCreatedPayload) {
        //FIXME: if email is missing we should get it from accounts services, but gateway sends it so should be fine for now.
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.REPORT_SUBMITTED,
            auth0Id: payload.auth0Id,
            email: payload.email,
            payload: payload as any,
        });
    }
}