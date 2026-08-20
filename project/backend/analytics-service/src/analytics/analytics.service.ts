import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent) private readonly repo: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsUser) private readonly userRepo: Repository<AnalyticsUser>,
    @InjectRepository(Campaign) private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(ClickEvent) private readonly clickRepo: Repository<ClickEvent>,
    @InjectRepository(SimulationSend) private readonly sendRepo: Repository<SimulationSend>,
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
    };
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
        email: e.email ?? 'unknown',
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

    return Array.from(users.entries())
      .map(([auth0Id, data]) => ({
        auth0Id,
        ...data,
      }))
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
    const existing = await this.userRepo.findOne({ where: { auth0Id: user.auth0Id } });
    if (existing) {
      Object.assign(existing, user);
      return this.userRepo.save(existing);
    }
    const newUser = this.userRepo.create(user);
    return this.userRepo.save(newUser);
  }
  
  async deleteUser(auth0Id: string) {
    await this.userRepo.delete({ auth0Id });
  }

  async upsertCampaign(campaign: Partial<Campaign>) {
    const existing = await this.campaignRepo.findOne({ where: { id: campaign.id } });
    if (existing) {
      Object.assign(existing, campaign);
      return this.campaignRepo.save(existing);
    }
    const newCampaign = this.campaignRepo.create(campaign);
    return this.campaignRepo.save(newCampaign);
  }

  async getSummary(periodDays = 30) {
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
  
    const current = await this.getPeriodStats(currentStart, now);
    const previous = await this.getPeriodStats(previousStart, currentStart);
  
    const delta = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;
  
    return {
      detectionRate: { value: current.detectionRate, delta: delta(current.detectionRate, previous.detectionRate) },
      clickRate: { value: current.clickRate, delta: delta(current.clickRate, previous.clickRate) },
      totalSimulations: { value: current.totalEmailsSent, delta: delta(current.totalEmailsSent, previous.totalEmailsSent) },
      atRiskUsers: { value: current.atRiskUsers, delta: delta(current.atRiskUsers, previous.atRiskUsers) },
      trainingCompletion: { value: current.trainingCompletionRate, delta: delta(current.trainingCompletionRate, previous.trainingCompletionRate) },
    };
  }

  private async getPeriodStats(start: Date, end: Date) {
    const [
      totalEmailsSent,
      totalReports,
      confirmedPhishing,
      falsePositives,
      totalClicks,
      educationAssigned,
      educationCompleted,
    ] = await Promise.all([
      this.repo.count({ where: { eventType: In([AnalyticsEventType.EMAIL_SENT, AnalyticsEventType.EMAIL_BATCH_SENT]), occurredAt: Between(start, end) } }),
      this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_SUBMITTED, occurredAt: Between(start, end) } }),
      this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_CONFIRMED, occurredAt: Between(start, end) } }),
      this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE, occurredAt: Between(start, end) } }),
      this.clickRepo.count({ where: { clickedAt: Between(start, end) } }),
      this.repo.count({ where: { eventType: AnalyticsEventType.EDUCATION_ASSIGNED, occurredAt: Between(start, end) } }),
      this.repo.count({ where: { eventType: AnalyticsEventType.EDUCATION_COMPLETED, occurredAt: Between(start, end) } }),
    ]);
  
    const detectionRate = totalReports > 0 ? (confirmedPhishing / totalReports) * 100 : 0;
    const clickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;
    // At-risk users: you need per-user click rates, which we don't compute here. Placeholder 0.
    const atRiskUsers = 0;
    const trainingCompletionRate = educationAssigned > 0 ? (educationCompleted / educationAssigned) * 100 : 0;
  
    return { totalEmailsSent, detectionRate, clickRate, atRiskUsers, trainingCompletionRate };
  }

  async getDetectionRateOverTime(periodDays = 30) {
    const start = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const events = await this.repo.find({
      where: {
        occurredAt: MoreThanOrEqual(start),
        eventType: In([AnalyticsEventType.REPORT_SUBMITTED, AnalyticsEventType.REPORT_CONFIRMED]),
      },
      order: { occurredAt: 'ASC' },
    });
    const clicks = await this.clickRepo.find({ where: { clickedAt: MoreThanOrEqual(start) } });
  
    const byDay = new Map<string, { reports: number; confirmed: number; clicks: number }>();
    for (let i = 0; i < periodDays; i++) {
      const day = new Date(start.getTime() + i * 86400000).toISOString().split('T')[0];
      byDay.set(day, { reports: 0, confirmed: 0, clicks: 0 });
    }
    for (const e of events) {
      const day = e.occurredAt.toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, { reports: 0, confirmed: 0, clicks: 0 });
      const b = byDay.get(day)!;
      if (e.eventType === AnalyticsEventType.REPORT_SUBMITTED) b.reports++;
      if (e.eventType === AnalyticsEventType.REPORT_CONFIRMED) b.confirmed++;
    }
    for (const c of clicks) {
      const day = c.clickedAt.toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, { reports: 0, confirmed: 0, clicks: 0 });
      byDay.get(day)!.clicks++;
    }
    const emailEvents = await this.repo.find({
      where: { occurredAt: MoreThanOrEqual(start), eventType: In([AnalyticsEventType.EMAIL_SENT, AnalyticsEventType.EMAIL_BATCH_SENT]) },
    });
    for (const e of emailEvents) {
      const day = e.occurredAt.toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, { reports: 0, confirmed: 0, clicks: 0 });
      // We need emailsSent per day; add if not already tracked
      const b = byDay.get(day)!;
      // We'll track separately; omitted for brevity
    }
  
    // Simplify: return reports/confirmed/clicks only for now
    return Array.from(byDay.entries()).map(([date, data]) => ({
      date,
      detectionRate: data.reports > 0 ? (data.confirmed / data.reports) * 100 : 0,
      clickRate: 0, // We'll compute later
    }));
  }

  
}
