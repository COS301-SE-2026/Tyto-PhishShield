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
import { get } from 'http';

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

    @RabbitSubscribe({
        exchange: 'xp-event-exchange',
        routingKey: 'xp.give',
        queue: 'analytics-xp-queue',
    })
    async onXpGiven(payload: XpPayload) {
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.XP_GIVEN,
            auth0Id: payload.auth0Id,
            payload: payload as any,
        });

        // Whenever XP is given for a phishing report, we report that report as confirmed.
        //This is a bit of a hack - better to listen to dedicated report.confirmend event.
        if (payload.reason && payload.reason.includes('phishing')) {
            await this.analyticsService.recordEvent({
                eventType: AnalyticsEventType.REPORT_CONFIRMED,
                auth0Id: payload.auth0Id,
                payload: payload as any,
            });
        }
    }

    @RabbitSubscribe({
        exchange: 'education-event-exchange',
        routingKey: 'education.assigned',
        queue: 'analytics-education-assigned-queue',

    })
    async onEducationAssigned(payload: EducationPayload) {
        //console.log('edu completed', payload); //debugging
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.EDUCATION_ASSIGNED,
            auth0Id: payload.auth0Id,
            email: payload.email,
            payload: payload as any,
        });

        // Whenever education is assigned, it's because the user reported a real phishing email(false positive)
        // so we count that as a false positive report.
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE,
            auth0Id: payload.auth0Id,
            email: payload.email,
            payload: payload as any,
        });
    }

    @RabbitSubscribe({
        exchange: 'mailing-event-exchange',
        routingKey: 'mailing.send',
        queue: 'analytics-mailing-send-queue',
    })
    async onEmailSent(payload: MailingPayload) {
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.EMAIL_SENT,
            payload: payload as any,
        });
    }

    @RabbitSubscribe({
        exchange: 'mailing-event-exchange',
        routingKey: 'mailing.schedule',
        queue: 'analytics-mailing-schedule-queue',
    })
    async onEmailScheduled(payload: MailingPayload) {
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.EMAIL_SCHEDULED,
            payload: payload as any,
        });
    }

    @RabbitSubscribe({
        exchange: 'mailing-event-exchange',
        routingKey: 'mailing.batch_send',
        queue: 'analytics-mailing-batch-send-queue',
    })
    async onBatchEmailSent(@Payload() payload: MailingPayload) {
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
            //just store the count for now, not the whole array
            payload: { count: payload.entries?.length ?? 0 },
        });
    }

    @RabbitSubscribe({
        exchange: 'mailing-event-exchange',
        routingKey: 'mailing.batch_schedule',
        queue: 'analytics-mailing-batch-schedule-queue',
    })
        async onBatchEmailScheduled(@Payload() payload: MailingPayload) {
        await this.analyticsService.recordEvent({
            eventType: AnalyticsEventType.EMAIL_SCHEDULED,
            payload: { count: payload.entries?.length ?? 0, batch: true },
        });
    }

    @Get('overview')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Top level stats for admin dashboard' })
    async getOverview() {
        return this.analyticsService.getOverview();
    }

    @Get('reports')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false})
    getReportStats(@Query('from') from?: string, @Query('to') to?: string) {
        //Note: if dates are invaled will just return 0s, will validate in future.
        return this.analyticsService.getReportStats(from, to);
    }

    @Get('mailing')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false})
    getMailingStats(@Query('from') from?: string, @Query('to') to?: string) {
        return this.analyticsService.getMailingStats(from, to);
    }

    @Get('timeseries')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false})
    getTimeSeries(@Query('from') from: string, @Query('to') to: string) {
        return this.analyticsService.getTimeSeries(from, to);
      }

    @Get('leaderboard')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'limit', required: false })
    getLeaderboard(@Query('limit') limit?: string) {
        const lim = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getLeaderboard(lim);
      }

    @Get('users/:auth0Id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getUserStats(@Param('auth0Id') auth0Id: string) {
        return this.analyticsService.getUserStats(auth0Id);
    }
    // for service to service
    @MessagePattern('analytics.getUserStats')
    getUserStatsTcp(auth0Id: string) {
        return this.analyticsService.getUserStats(auth0Id);
    }

    @MessagePattern('analytics.getOverview')
    getOverviewTcp() {
        return this.analyticsService.getOverview();
    }
}