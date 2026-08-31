import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
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
  emailId?: string;
  auth0Id?: string;
  campaignId?: string;
  entries?: {
    referenceNumber: string;
    recipient?: string;
    scheduledAt: string;
    emailId?: string;
    auth0Id?: string;
    waveId?: string;
  }[];
}

interface AccountUserPayload {
  auth0Id: string;
  email?: string;
  name?: string;
  department?: string;
  role?: string;
}

interface WaveEventPayload {
  waveId: string;
  waveName?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  sameEmail?: boolean;
  randomisedTimes?: boolean;
  numberOfRecipients?: number;
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
      payload: payload as unknown as Record<string, unknown>,
    });
  }

  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: ['xp.give', 'xp.given'],
    queue: 'analytics-xp-queue',
  })
  async onXpGiven(payload: XpPayload) {
    await this.analyticsService.recordEvent({
      eventType: AnalyticsEventType.XP_GIVEN,
      auth0Id: payload.auth0Id,
      payload: payload as unknown as Record<string, unknown>,
    });

    // Whenever XP is given for a phishing report, we report that report as confirmed.
    //This is a bit of a hack - better to listen to dedicated report.confirmend event.
    const reason = (payload.reason ?? '').toLowerCase();
    if (reason.includes('phishing')) {
      await this.analyticsService.recordEvent({
        eventType: AnalyticsEventType.REPORT_CONFIRMED,
        auth0Id: payload.auth0Id,
        payload: payload as unknown as Record<string, unknown>,
      });
    }
    if (reason.includes('compromised')) {
      await this.analyticsService.recordClickFromAuth0Id(payload.auth0Id);
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
      payload: payload as unknown as Record<string, unknown>,
    });

    // Whenever education is assigned, it's because the user reported a real phishing email(false positive)
    // so we count that as a false positive report.
    await this.analyticsService.recordEvent({
      eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE,
      auth0Id: payload.auth0Id,
      email: payload.email,
      payload: payload as unknown as Record<string, unknown>,
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
      payload: payload as unknown as Record<string, unknown>,
    });
    if (payload.emailId && payload.referenceNumber) {
      await this.analyticsService.recordSimulationSend({
        emailId: payload.emailId,
        referenceNumber: payload.referenceNumber,
        auth0Id: payload.auth0Id,
        campaignId: payload.campaignId,
        sentAt: payload.scheduledAt
          ? new Date(payload.scheduledAt)
          : new Date(),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'mailing.schedule',
    queue: 'analytics-mailing-schedule-queue',
  })
  async onEmailScheduled(payload: MailingPayload) {
    await this.analyticsService.recordEvent({
      eventType: AnalyticsEventType.EMAIL_SCHEDULED,
      payload: payload as unknown as Record<string, unknown>,
    });

    if (payload.emailId && payload.referenceNumber) {
      await this.analyticsService.recordSimulationSend({
        emailId: payload.emailId,
        referenceNumber: payload.referenceNumber,
        auth0Id: payload.auth0Id,
        campaignId: payload.campaignId,
        sentAt: payload.scheduledAt
          ? new Date(payload.scheduledAt)
          : new Date(),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'mailing.batch_send',
    queue: 'analytics-mailing-batch-send-queue',
  })
  async onBatchEmailSent(payload: MailingPayload) {
    await this.analyticsService.recordEvent({
      eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
      payload: { count: payload.entries?.length ?? 0 },
    });

    for (const entry of payload.entries ?? []) {
      if (entry.emailId && entry.referenceNumber) {
        await this.analyticsService.recordSimulationSend({
          emailId: entry.emailId,
          referenceNumber: entry.referenceNumber,
          auth0Id: entry.auth0Id,
          campaignId: entry.waveId,
          sentAt: entry.scheduledAt ? new Date(entry.scheduledAt) : new Date(),
        });
      }
    }
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: 'mailing.batch_schedule',
    queue: 'analytics-mailing-batch-schedule-queue',
  })
  async onBatchEmailScheduled(payload: MailingPayload) {
    await this.analyticsService.recordEvent({
      eventType: AnalyticsEventType.EMAIL_SCHEDULED,
      payload: { count: payload.entries?.length ?? 0, batch: true },
    });

    for (const entry of payload.entries ?? []) {
      if (entry.emailId && entry.referenceNumber) {
        await this.analyticsService.recordSimulationSend({
          emailId: entry.emailId,
          referenceNumber: entry.referenceNumber,
          auth0Id: entry.auth0Id,
          campaignId: entry.waveId,
          sentAt: entry.scheduledAt ? new Date(entry.scheduledAt) : new Date(),
        });
      }
    }
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.created',
    queue: 'analytics-user-created-queue',
  })
  async onUserCreated(payload: AccountUserPayload) {
    await this.analyticsService.upsertUser({
      auth0Id: payload.auth0Id,
      email: payload.email,
      name: payload.name,
      department: payload.department,
      role: payload.role,
    });
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.updated',
    queue: 'analytics-user-updated-queue',
  })
  async onUserUpdated(payload: AccountUserPayload) {
    await this.analyticsService.upsertUser({
      auth0Id: payload.auth0Id,
      email: payload.email,
      name: payload.name,
      department: payload.department,
      role: payload.role,
    });
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.deleted',
    queue: 'analytics-user-deleted-queue',
  })
  async onUserDeleted(payload: AccountUserPayload) {
    await this.analyticsService.deleteUser(payload.auth0Id);
  }

  @RabbitSubscribe({
    exchange: 'wave-event-exchange',
    routingKey: 'wave.create',
    queue: 'analytics-wave-create-queue',
  })
  async onWaveCreate(payload: WaveEventPayload) {
    await this.analyticsService.upsertCampaign({
      id: payload.waveId,
      name: payload.waveName,
      status: 'active',
      targetDepartments: undefined,
      startDate: payload.scheduledFrom
        ? new Date(payload.scheduledFrom)
        : undefined,
      endDate: payload.scheduledTo ? new Date(payload.scheduledTo) : undefined,
      createdBy: undefined,
    });
  }

  @RabbitSubscribe({
    exchange: 'wave-event-exchange',
    routingKey: 'wave.delete',
    queue: 'analytics-wave-delete-queue',
  })
  async onWaveDelete(payload: { waveId: string }) {
    await this.analyticsService.deleteCampaign(payload.waveId);
  }
  // wave.updated, wave.completed similar

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
  @ApiQuery({ name: 'to', required: false })
  getReportStats(@Query('from') from?: string, @Query('to') to?: string) {
    //Note: if dates are invaled will just return 0s, will validate in future.
    return this.analyticsService.getReportStats(from, to);
  }

  @Get('mailing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getMailingStats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getMailingStats(from, to);
  }

  @Get('timeseries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
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

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'period', required: false })
  getSummary(@Query('period') period?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return this.analyticsService.getSummary(days);
  }

  @Get('detection-rate-over-time')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'period', required: false })
  getDetectionRateOverTime(@Query('period') period?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return this.analyticsService.getDetectionRateOverTime(days);
  }

  @Get('by-department')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'period', required: false })
  getByDepartment(@Query('period') period?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return this.analyticsService.getByDepartment(days);
  }

  @Get('at-risk-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAtRiskUsers(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const lim = limit ? Number.parseInt(limit, 10) : 10;
    return this.analyticsService.getAtRiskUsers(days, lim);
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCampaigns() {
    return this.analyticsService.getCampaigns();
  }

  @MessagePattern('analytics.getOverview')
  getOverviewTcp() {
    return this.analyticsService.getOverview();
  }
}
