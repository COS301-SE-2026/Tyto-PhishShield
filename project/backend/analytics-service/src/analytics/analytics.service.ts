// Some event types and methods may be removed or changed once the frontend dashboard is finalised.

/**
 * Service: analytics-service
 *
 * Contains the business logic for analytics aggregation.
 * Stores raw events in the analytics_events table and maintains
 * mirrored data for users, campaigns, clicks, and simulation sends.
 * Provides dashboard-ready summaries, time series, department breakdowns,
 * at-risk user lists, and campaign performance.
 *
 * Functions:
 * - {@link AnalyticsService#recordEvent} - Persists a generic analytics event.
 * - {@link AnalyticsService#getOverview} - Returns raw counts for the legacy overview endpoint.
 * - {@link AnalyticsService#getReportStats} - Aggregates report submission counts and detection rate.
 * - {@link AnalyticsService#getMailingStats} - Aggregates sent and scheduled simulation counts.
 * - {@link AnalyticsService#getUserStats} - Returns analytics for a single user.
 * - {@link AnalyticsService#getTimeSeries} - Groups events per day for charting.
 * - {@link AnalyticsService#getLeaderboard} - Ranks users by XP.
 * - {@link AnalyticsService#upsertUser} - Inserts or updates a mirrored analytics user.
 * - {@link AnalyticsService#deleteUser} - Removes a mirrored analytics user.
 * - {@link AnalyticsService#upsertCampaign} - Inserts or updates a mirrored campaign.
 * - {@link AnalyticsService#deleteCampaign} - Removes a mirrored campaign.
 * - {@link AnalyticsService#recordSimulationSend} - Records a sent simulation email.
 * - {@link AnalyticsService#recordClickFromEmailId} - Records a click based on Resend email ID.
 * - {@link AnalyticsService#recordClickFromAuth0Id} - Fallback click recording when only auth0Id is known.
 * - {@link AnalyticsService#getSummary} - Returns KPI cards with deltas.
 * - {@link AnalyticsService#getDetectionRateOverTime} - Daily detection and click rate series.
 * - {@link AnalyticsService#getByDepartment} - Breaks down stats per department.
 * - {@link AnalyticsService#getAtRiskUsers} - Lists users with high click rates.
 * - {@link AnalyticsService#getCampaigns} - Lists campaigns and marks completed ones.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  QueryFailedError,
} from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from './entities/analytics-event.entity';
import { AnalyticsUser } from './entities/analytics-user.entity';

import { Campaign } from './entities/campaign.entity';
import { ClickEvent } from './entities/click-event.entity';
import { SimulationSend } from './entities/simulation-send.entity';

interface RecordEventInput {
  eventType: AnalyticsEventType;
  auth0Id?: string;
  email?: string;
  payload?: Record<string, unknown>;
}

export interface AtRiskUser {
  auth0Id: string;
  name?: string;
  department?: string;
  clickRate: number;
  riskLevel: 'high' | 'medium';
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsUser)
    private readonly userRepo: Repository<AnalyticsUser>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,

    @InjectRepository(ClickEvent)
    private readonly clickRepo: Repository<ClickEvent>,
    @InjectRepository(SimulationSend)
    private readonly sendRepo: Repository<SimulationSend>,
  ) {}

  //just store whatever comes in, we can figure out the queries later.
  async recordEvent(input: RecordEventInput): Promise<void> {
    const event = this.repo.create(input);
    await this.repo.save(event);
    //console.log(`recorded $(input.eventType)', input); // debugging
  }
  //first will be the overview which will do a count for every event type, later will be the more specific types, but for a more general view we have this part.
  async getOverview() {
    const [
      singleSent,
      batchSent,
      reports,
      confirmed,
      falsePos,
      totalXp,
      eduAssigned,
      eduDone,
    ] = await Promise.all([
      this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SENT } }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.EMAIL_BATCH_SENT },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.REPORT_SUBMITTED },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.REPORT_CONFIRMED },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE },
      }),
      this.sumXp(),
      this.repo.count({
        where: { eventType: AnalyticsEventType.EDUCATION_ASSIGNED },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.EDUCATION_COMPLETED },
      }),
    ]);

    return {
      totalEmailsSent: singleSent + batchSent,
      totalReports: reports,
      confirmedPhishing: confirmed,
      falsePositives: falsePos,
      totalXpGiven: totalXp,
      educationAssigned: eduAssigned,
      educationCompleted: eduDone,
    };
  }

  //nice addition for reports page on the frontend, this will give the counts for the reports and the detection rate, which is the confirmed reports over the total reports.
  async getReportStats(from?: string, to?: string) {
    const where = this.makeWhere(from, to);

    const [submitted, confirmed, falsePositive] = await Promise.all([
      this.repo.count({
        where: { eventType: AnalyticsEventType.REPORT_SUBMITTED, ...where },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.REPORT_CONFIRMED, ...where },
      }),
      this.repo.count({
        where: {
          eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE,
          ...where,
        },
      }),
    ]);

    const detectionRate =
      submitted > 0 ? Math.round((confirmed / submitted) * 100) : 0;

    return { submitted, confirmed, falsePositive, detectionRate };
  }

  async getMailingStats(from?: string, to?: string) {
    const where = this.makeWhere(from, to);

    const [sent, scheduled, batchSent, batchScheduled] = await Promise.all([
      this.repo.count({
        where: { eventType: AnalyticsEventType.EMAIL_SENT, ...where },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where },
      }),
      this.repo.count({
        where: { eventType: AnalyticsEventType.EMAIL_BATCH_SENT, ...where },
      }),
      // batch_schedule stored as EMAIL_SCHEDULED with a batch flag.
      this.repo.count({
        where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where },
      }),
    ]);

    return {
      totalSent: sent + batchSent,
      scheduled: scheduled + batchScheduled,
    };
  }
  //per use stuff, thsi might be moved to accounts service later.
  async getUserStats(auth0Id: string) {
    const [reports, confirmed, falsePos, xpEvents, eduDone] = await Promise.all(
      [
        this.repo.count({
          where: { auth0Id, eventType: AnalyticsEventType.REPORT_SUBMITTED },
        }),
        this.repo.count({
          where: { auth0Id, eventType: AnalyticsEventType.REPORT_CONFIRMED },
        }),
        this.repo.count({
          where: {
            auth0Id,
            eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE,
          },
        }),
        this.repo.find({
          where: { auth0Id, eventType: AnalyticsEventType.XP_GIVEN },
        }),
        this.repo.count({
          where: { auth0Id, eventType: AnalyticsEventType.EDUCATION_COMPLETED },
        }),
      ],
    );

    const totalXp = xpEvents.reduce((sum, e) => {
      const amount = e.payload?.['amount'];
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    return {
      reports,

      confirmed,
      falsePositive: falsePos,
      totalXp,
      educationCompleted: eduDone,
      securityScore: this.calculateSecurityScore(totalXp, reports, confirmed),
    };
  }

  private static readonly XP_MAX_SCORE = 500;

  private calculateSecurityScore(
    totalXp: number,
    reports: number,
    confirmed: number,
  ): number {
    const xpScore = Math.max(
      0,
      Math.min(100, (totalXp / AnalyticsService.XP_MAX_SCORE) * 100),
    );
    const detectionScore = reports > 0 ? (confirmed / reports) * 100 : 50;
    return Math.round(0.5 * xpScore + 0.5 * detectionScore);
  }

  //time series data, this will be used for graphs and charts.
  async getTimeSeries(
    from: string,
    to: string,
  ): Promise<
    { date: string; reports: number; emailsSent: number; xpGiven: number }[]
  > {
    //TODO: if the range is too large this could load all events into memory, could trim down to only the event types we care about, but for now this is fine.
    const events = await this.repo.find({
      where: {
        occurredAt: Between(new Date(from), new Date(to)),
      },
      order: { occurredAt: 'ASC' },
    });

    const byDay = new Map<
      string,
      { reports: number; emailsSent: number; xpGiven: number }
    >();

    for (const e of events) {
      const day = e.occurredAt.toISOString().split('T')[0];
      if (!byDay.has(day))
        byDay.set(day, { reports: 0, emailsSent: 0, xpGiven: 0 });
      const bucket = byDay.get(day);

      if (e.eventType === AnalyticsEventType.REPORT_SUBMITTED) bucket.reports++;
      if (
        e.eventType === AnalyticsEventType.EMAIL_SENT ||
        e.eventType === AnalyticsEventType.EMAIL_BATCH_SENT
      )
        bucket.emailsSent++;
      if (e.eventType === AnalyticsEventType.XP_GIVEN) {
        const amt = e.payload?.['amount'];
        bucket.xpGiven += typeof amt === 'number' ? amt : 0;
      }
    }
    return Array.from(byDay.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getLeaderboard(limit = 10) {
    const xpEvents = await this.repo.find({
      where: { eventType: AnalyticsEventType.XP_GIVEN },
    });
    const confirmedReports = await this.repo.find({
      where: { eventType: AnalyticsEventType.REPORT_CONFIRMED },
    });

    const users = new Map<
      string,
      { email: string; totalXp: number; reportCount: number }
    >();

    for (const e of xpEvents) {
      if (!e.auth0Id) continue;
      const entry = users.get(e.auth0Id) ?? {
        email: 'unknown',
        totalXp: 0,
        reportCount: 0,
      };
      entry.totalXp +=
        typeof e.payload?.['amount'] === 'number' ? e.payload['amount'] : 0;
      users.set(e.auth0Id, entry);
    }

    for (const e of confirmedReports) {
      if (!e.auth0Id) continue;
      const entry = users.get(e.auth0Id);
      if (entry) entry.reportCount++;
    }

    // Fetch all mirrored users to replace "unknown" emails
    const allUsers = await this.userRepo.find();
    const userMap = new Map(allUsers.map((u) => [u.auth0Id, u]));

    return Array.from(users.entries())
      .map(([auth0Id, data]) => {
        const user = userMap.get(auth0Id);
        return {
          auth0Id,
          email: user?.email ?? data.email, // fallback to event email if user not found
          totalXp: data.totalXp,
          reportCount: data.reportCount,
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, limit);
  }

  private async count(eventType: AnalyticsEventType): Promise<number> {
    return this.repo.count({ where: { eventType } });
  }

  private async sumXp(): Promise<number> {
    const events = await this.repo.find({
      where: { eventType: AnalyticsEventType.XP_GIVEN },
    });

    return events.reduce((sum, e) => {
      const val = e.payload?.['amount'];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
  }
  //WARNING: if no dates given this will return all events, which could be a lot, so be careful with this one.
  //TODO: maybe mandatory date range later.
  private makeWhere(from?: string, to?: string) {
    if (from && to)
      return { occurredAt: Between(new Date(from), new Date(to)) };
    if (from)
      return {
        occurredAt: MoreThanOrEqual(new Date(from)),
      };

    if (to)
      return {
        occurredAt: LessThanOrEqual(new Date(to)),
      };
    return {};
  }

  async upsertUser(user: {
    auth0Id: string;
    email?: string;
    name?: string;
    department?: string;
    role?: string;
  }) {
    try {
      const existing = await this.userRepo.findOne({
        where: { auth0Id: user.auth0Id },
      });
      if (existing) {
        Object.assign(existing, user);
        return await this.userRepo.save(existing);
      }
      const newUser = this.userRepo.create(user);
      return await this.userRepo.save(newUser);
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const driverError = err.driverError as { code?: string } | undefined;
        if (driverError?.code === '23505') {
          this.logger.warn(
            `Duplicate user event for ${user.auth0Id}, ignoring`,
            // console.log(`recorded event ${input.eventType} for user ${input.auth0Id}`);
          );
          return;
        }
      }
      throw err;
    }
  }

  async deleteUser(auth0Id: string) {
    await this.userRepo.delete({ auth0Id });
  }

  //just need to make sure about these events form darius to ensure this works well.
  async upsertCampaign(campaign: Partial<Campaign>) {
    const existing = await this.campaignRepo.findOne({
      where: { id: campaign.id },
    });
    if (existing) {
      Object.assign(existing, campaign);
      return this.campaignRepo.save(existing);
    }

    const newCampaign = this.campaignRepo.create(campaign);
    return this.campaignRepo.save(newCampaign);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.campaignRepo.delete({ id: campaignId });
  }
  //also check mailing events here
  async recordSimulationSend(input: {
    emailId: string;
    referenceNumber: string;
    auth0Id?: string;
    campaignId?: string;
    sentAt?: Date;
  }): Promise<void> {
    const existing = await this.sendRepo.findOne({
      where: { emailId: input.emailId },
    });

    if (existing) {
      // Already recorded, maybe update some fields if necessary
      if (input.auth0Id !== undefined) existing.auth0Id = input.auth0Id;
      if (input.campaignId !== undefined)
        existing.campaignId = input.campaignId;
      if (input.referenceNumber !== undefined)
        existing.referenceNumber = input.referenceNumber;
      if (input.sentAt !== undefined) existing.sentAt = input.sentAt;
      // console.log(`recorded event ${input.eventType} for user ${input.auth0Id}`);
      await this.sendRepo.save(existing);
      return;
    }

    const send = this.sendRepo.create(input);
    await this.sendRepo.save(send);
  }

  async recordClickFromEmailId(emailId: string): Promise<void> {
    const send = await this.sendRepo.findOne({
      where: { emailId },
    });

    if (!send) {
      this.logger.warn(`Click received for unknown emailId: ${emailId}`);
      return;
    }

    const click = this.clickRepo.create({
      referenceNumber: send.referenceNumber,

      auth0Id: send.auth0Id,
      campaignId: send.campaignId,
    });

    await this.clickRepo.save(click);
  }
  //similar to overview, but fo phase 2/3 of the analytics service as discussed with Frikkie.
  async getSummary(periodDays = 30) {
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodDays * 86400000);
    const previousStart = new Date(
      currentStart.getTime() - periodDays * 86400000,
    );

    const current = await this.getPeriodStats(currentStart, now);

    const previous = await this.getPeriodStats(previousStart, currentStart);

    const currentAtRisk = await this.getAtRiskUsers(
      periodDays,
      1000,
      currentStart,
      now,
    );
    const previousAtRisk = await this.getAtRiskUsers(
      periodDays,
      1000,
      previousStart,
      currentStart,
    );

    const delta = (curr: number, prev: number) =>
      prev === 0 ? 0 : ((curr - prev) / prev) * 100;

    return {
      detectionRate: {
        value: current.detectionRate,
        delta: delta(current.detectionRate, previous.detectionRate),
      },
      clickRate: {
        value: current.clickRate,
        delta: delta(current.clickRate, previous.clickRate),
      },

      totalSimulations: {
        value: current.totalEmailsSent,

        delta: delta(current.totalEmailsSent, previous.totalEmailsSent),
      },
      atRiskUsers: {
        value: currentAtRisk.length,
        delta: delta(currentAtRisk.length, previousAtRisk.length),
      },
      trainingCompletion: {
        value: current.trainingCompletionRate,
        delta: delta(
          current.trainingCompletionRate,
          previous.trainingCompletionRate,
        ),
      },
    };
  }
  //TODO: finish getPeriodStats function to also compute the at risk users if necessary. Will check how it works without first.
  private async getPeriodStats(start: Date, end: Date) {
    const [
      totalEmailsSent,
      totalReports,

      confirmedPhishing,
      totalClicks,
      educationAssigned,
      educationCompleted,
    ] = await Promise.all([
      this.repo.count({
        where: {
          eventType: In([
            AnalyticsEventType.EMAIL_SENT,
            AnalyticsEventType.EMAIL_BATCH_SENT,
          ]),
          occurredAt: Between(start, end),
        },
      }),
      this.repo.count({
        where: {
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          occurredAt: Between(start, end),
        },
      }),
      this.repo.count({
        where: {
          eventType: AnalyticsEventType.REPORT_CONFIRMED,
          occurredAt: Between(start, end),
        },
      }),
      this.clickRepo.count({ where: { clickedAt: Between(start, end) } }),
      this.repo.count({
        where: {
          eventType: AnalyticsEventType.EDUCATION_ASSIGNED,
          occurredAt: Between(start, end),
        },
      }),
      this.repo.count({
        where: {
          eventType: AnalyticsEventType.EDUCATION_COMPLETED,
          occurredAt: Between(start, end),
        },
      }),
    ]);

    const detectionRate =
      totalReports > 0 ? (confirmedPhishing / totalReports) * 100 : 0;
    const clickRate =
      totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;
    // At-risk users: you need per-user click rates, which we don't compute here. Placeh
    // older 0.
    const atRiskUsers = 0;
    const trainingCompletionRate =
      educationAssigned > 0
        ? (educationCompleted / educationAssigned) * 100
        : 0;

    return {
      totalEmailsSent,
      detectionRate,
      clickRate,
      atRiskUsers,
      trainingCompletionRate,
    };
  }
  //might need some math help to get the date stuff just right. Will see though.
  async getDetectionRateOverTime(periodDays = 30) {
    const start = new Date(Date.now() - periodDays * 86400000);
    const reports = await this.repo.find({
      where: {
        occurredAt: MoreThanOrEqual(start),
        eventType: In([
          AnalyticsEventType.REPORT_SUBMITTED,
          AnalyticsEventType.REPORT_CONFIRMED,
        ]),
      },
      order: { occurredAt: 'ASC' },
    });
    const sends = await this.sendRepo.find({
      where: { sentAt: MoreThanOrEqual(start) },
    });
    const clicks = await this.clickRepo.find({
      where: { clickedAt: MoreThanOrEqual(start) },
    });
    // Initialize the byDay map with all days in the period
    const byDay = new Map<
      string,
      { reports: number; confirmed: number; sent: number; clicks: number }
    >();
    for (let i = 0; i < periodDays; i++) {
      const day = new Date(start.getTime() + i * 86400000)
        .toISOString()
        .split('T')[0];
      byDay.set(day, { reports: 0, confirmed: 0, sent: 0, clicks: 0 });
    }
    //go through the reports, sends, and clicks to populate the byDay map with counts for each day in the period.
    for (const e of reports) {
      const day = e.occurredAt.toISOString().split('T')[0];
      if (!byDay.has(day))
        byDay.set(day, { reports: 0, confirmed: 0, sent: 0, clicks: 0 });
      // console.log(`recorded event ${input.eventType} for user ${input.auth0Id}`);

      const b = byDay.get(day);
      if (e.eventType === AnalyticsEventType.REPORT_SUBMITTED) b.reports++;
      if (e.eventType === AnalyticsEventType.REPORT_CONFIRMED) b.confirmed++;
    }
    // loop through the sends and clicks to populate the byDay map with counts for each day in the period.
    for (const s of sends) {
      if (!s.sentAt) continue;
      const day = s.sentAt.toISOString().split('T')[0];
      if (!byDay.has(day))
        byDay.set(day, { reports: 0, confirmed: 0, sent: 0, clicks: 0 });
      byDay.get(day).sent++;
    } // loop through the clicks to populate the byDay map with counts for each day in the period.

    for (const c of clicks) {
      const day = c.clickedAt.toISOString().split('T')[0];
      if (!byDay.has(day))
        byDay.set(day, { reports: 0, confirmed: 0, sent: 0, clicks: 0 });
      byDay.get(day).clicks++;
      // console.log(`recorded event ${input.eventType} for user ${input.auth0Id}`);
    }

    return Array.from(byDay.entries()).map(([date, data]) => ({
      date,
      detectionRate:
        data.reports > 0 ? (data.confirmed / data.reports) * 100 : 0,

      clickRate: data.sent > 0 ? (data.clicks / data.sent) * 100 : 0,
    }));
  }

  async getByDepartment(periodDays = 30) {
    const start = new Date(Date.now() - periodDays * 86400000);
    const users = await this.userRepo.find();
    const authToDept = new Map(users.map((u) => [u.auth0Id, u.department]));

    const reports = await this.repo.find({
      where: {
        occurredAt: MoreThanOrEqual(start),
        eventType: In([
          AnalyticsEventType.REPORT_SUBMITTED,
          AnalyticsEventType.REPORT_CONFIRMED,
        ]),
      },
    });

    const sends = await this.sendRepo.find({
      where: { sentAt: MoreThanOrEqual(start) },
    });

    const clicks = await this.clickRepo.find({
      where: { clickedAt: MoreThanOrEqual(start) },
    });

    const deptMap = new Map<
      string,
      { sent: number; reported: number; confirmed: number; clicked: number }
    >();

    // Initialize
    for (const u of users) {
      if (u.department && !deptMap.has(u.department)) {
        deptMap.set(u.department, {
          sent: 0,
          reported: 0,
          confirmed: 0,
          clicked: 0,
        });
        //console.log(`user ${u.auth0Id} in department ${u.department}`);
      }
    }

    // sends
    for (const s of sends) {
      const dept = s.auth0Id ? authToDept.get(s.auth0Id) : undefined;
      if (!dept) continue;
      if (!deptMap.has(dept))
        deptMap.set(dept, { sent: 0, reported: 0, confirmed: 0, clicked: 0 });
      deptMap.get(dept).sent++;
    }

    // reports
    for (const e of reports) {
      const dept = e.auth0Id ? authToDept.get(e.auth0Id) : undefined;
      // console.log(`report event for user ${e.auth0Id} in department ${dept} at ${e.occurredAt}`);
      if (!dept) continue;
      if (!deptMap.has(dept))
        deptMap.set(dept, { sent: 0, reported: 0, confirmed: 0, clicked: 0 });
      const b = deptMap.get(dept);

      if (e.eventType === AnalyticsEventType.REPORT_SUBMITTED) b.reported++;
      if (e.eventType === AnalyticsEventType.REPORT_CONFIRMED) b.confirmed++;
    }

    // clicks
    for (const c of clicks) {
      const dept = c.auth0Id ? authToDept.get(c.auth0Id) : undefined;
      if (!dept) continue;
      if (!deptMap.has(dept))
        deptMap.set(dept, { sent: 0, reported: 0, confirmed: 0, clicked: 0 });
      deptMap.get(dept).clicked++;
    }
    // Compute the final results
    return Array.from(deptMap.entries()).map(([department, d]) => ({
      department,
      sent: d.sent,
      reported: d.reported,
      detectionRate: d.reported > 0 ? (d.confirmed / d.reported) * 100 : 0,
      clickRate: d.sent > 0 ? (d.clicked / d.sent) * 100 : 0,
    }));
  }
  // will use this in conjunction with resend webhook. Check the webhook with Darius to ensure this works well. This will be used to get the at risk users, which is defined as users with a click rate above 30% in the given period.
  async getAtRiskUsers(
    periodDays = 30,
    limit = 10,
    startOverride?: Date,
    endOverride?: Date,
  ): Promise<AtRiskUser[]> {
    const end = endOverride ?? new Date();
    const start =
      startOverride ?? new Date(end.getTime() - periodDays * 86400000);

    const sends = await this.sendRepo.find({
      where: { sentAt: Between(start, end) },
    });
    const clicks = await this.clickRepo.find({
      where: { clickedAt: Between(start, end) },
    });

    const userSends = new Map<string, number>();

    const userClicks = new Map<string, number>();

    for (const s of sends) {
      if (s.auth0Id)
        userSends.set(s.auth0Id, (userSends.get(s.auth0Id) ?? 0) + 1);
      // console.log(`send event for user ${s.auth0Id} at ${s.sentAt}`);
    }
    for (const c of clicks) {
      if (c.auth0Id)
        userClicks.set(c.auth0Id, (userClicks.get(c.auth0Id) ?? 0) + 1);
      // console.log(`click event for user ${c.auth0Id} at ${c.clickedAt}`);
    }

    const users = await this.userRepo.find();
    const result: AtRiskUser[] = [];

    for (const [auth0Id, clickCount] of userClicks.entries()) {
      const sentCount = userSends.get(auth0Id) ?? 0;
      if (sentCount === 0) continue;

      const clickRate = (clickCount / sentCount) * 100;
      if (clickRate < 30) continue;

      const user = users.find((u) => u.auth0Id === auth0Id);
      if (!user) continue;

      result.push({
        auth0Id,

        name: user.name,
        department: user.department,
        clickRate: Math.round(clickRate),
        riskLevel: clickRate > 60 ? 'high' : 'medium',
      });
    }

    return result.slice(0, limit);
  }

  async getCampaigns() {
    const campaigns = await this.campaignRepo.find({
      order: { startDate: 'DESC' },
    });

    const now = new Date();

    return campaigns.map((campaign) => {
      if (campaign.endDate && campaign.endDate < now) {
        return { ...campaign, status: 'completed' };
        // debugging
        // console.log(`recorded event ${input.eventType} for user ${input.auth0Id}`);
      }
      return campaign;
    });
  }

  async recordClickFromAuth0Id(auth0Id: string): Promise<void> {
    const click = this.clickRepo.create({
      referenceNumber: 'unknown', // no emailId available, use placeholder
      auth0Id,
    });
    await this.clickRepo.save(click);
  }
}
