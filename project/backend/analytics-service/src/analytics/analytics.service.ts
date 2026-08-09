import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AnalyticsEvent, AnalyticsEventType } from './entities/analytics-event.entity'

interface RecordEventInput {
    eventType: AnalyticsEventType;
    auth0Id?: string;
    email?: string;
    payload?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(AnalyticsEvent)
        private readonly repo: Repository<AnalyticsEvent>,
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
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SENT }}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_BATCH_SENT }}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_SUBMITTED }}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_CONFIRMED }}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE }}),
            this.sumXp(),
            this.repo.count({ where: { eventType: AnalyticsEventType.EDUCATION_ASSIGNED }}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EDUCATION_COMPLETED }}),
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
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_SUBMITTED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_CONFIRMED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE, ...where}}),
        ]);

        const detectionRate = submitted > 0 ? Math.round((confirmed / submitted) * 100) : 0;

        return { submitted, confirmed, falsePositive, detectionRate };

    }

    async getMailingStats(from?: string, to?: string) {
        const where = this.makeWhere(from, to);

        const [sent, scheduled, batchSent, batchScheduled] = await Promise.all([
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SENT, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_BATCH_SENT, ...where}}),
            // batch_schedule stored as EMAIL_SCHEDULED with a batch flag.
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where } }),
        ]);

        return {
            totalSent: sent + batchSent,
            scheduled: scheduled + batchScheduled,
        };
    }
    //per use stuff, thsi might be moved to accounts service later.
    async getUserStats(auth0Id: string) {
        const [reports, confirmed, falsePos, xpEvents, eduDone] = 
        await Promise.all([
            this.repo.count({ where: { auth0Id, eventType: AnalyticsEventType.REPORT_SUBMITTED } }),
            this.repo.count({ where: { auth0Id, eventType: AnalyticsEventType.REPORT_CONFIRMED } }),
            this.repo.count({ where: { auth0Id, eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE } }),
            this.repo.count({ where: { auth0Id, eventType: AnalyticsEventType.XP_GIVEN } }),
            this.repo.count({ where: { auth0Id, eventType: AnalyticsEventType.EDUCATION_COMPLETED } }),
        ]);

        const totalXp = xpEvents.reduce((sum, e) => {
            const amount = e.payload?.['amount'];
            return sum + (typeof amount === 'number' ? amount: 0);
        }, 0);

        return { reports, confirmed, falsePositive: falsePos, totalXp, educationCompleted: eduDone };
    }
    //time series data, this will be used for graphs and charts.
    async getTimeSeries(from: string, to: string): Promise<{ date: string; reports:number; emailsSent: number; xpGiven: number;}[]> {
        //TODO: if the range is too large this could load all events into memory, could trim down to only the event types we care about, but for now this is fine.
        const events = await this.repo.find({
            where: {
                occurredAt: Between(new Date(from), new Date(to)),
            },
            order: { occurredAt: 'ASC'}
        });

        const byDay = new Map<string, { reports: number; emailsSent: number; xpGiven: number }>();

            for (const e of events) {
              const day = e.occurredAt.toISOString().split('T')[0];
              if (!byDay.has(day)) byDay.set(day, { reports: 0, emailsSent: 0, xpGiven: 0 });
              const bucket = byDay.get(day)!;
        
              if (e.eventType === AnalyticsEventType.REPORT_SUBMITTED) bucket.reports++;
              if (
                e.eventType === AnalyticsEventType.EMAIL_SENT ||
                e.eventType === AnalyticsEventType.EMAIL_BATCH_SENT
              ) bucket.emailsSent++;
              if (e.eventType === AnalyticsEventType.XP_GIVEN) {
                const amt = e.payload?.['amount'];
                bucket.xpGiven += typeof amt === 'number' ? amt : 0;
              }
            }
        return Array.from(byDay.entries()).map(([date, data]) => ({ date, ...data }));
    }

  async getLeaderboard(limit = 10) {
    const xpEvents = await this.repo.find({
      where: { eventType: AnalyticsEventType.XP_GIVEN },
    });
    const confirmedReports = await this.repo.find({
      where: { eventType: AnalyticsEventType.REPORT_CONFIRMED },
    });

    const users = new Map<string, { email: string; totalXp: number; reportCount: number }>();

    for (const e of xpEvents) {
      if (!e.auth0Id) continue;
      const entry = users.get(e.auth0Id) ?? {
        email: e.email ?? 'unknown',
        totalXp: 0,
        reportCount: 0,
      };
      entry.totalXp += typeof e.payload?.['amount'] === 'number' ? (e.payload['amount'] as number) : 0;
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
        return this.repo.count({ where: {eventType} });
    }

    private async sumXp(): Promise<number> {
        const events = await this.repo.find({ where: { eventType: AnalyticsEventType.XP_GIVEN } });
        return events.reduce((sum, e ) => {
            const val = e.payload?.['amount'];
            return sum + (typeof val === 'number' ? val : 0);
        }, 0);
    }
    //WARNING: if no dates given this will return all events, which could be a lot, so be careful with this one.
    //TODO: maybe mandatory date range later.
    private makeWhere(from?: string, to?: string) {
        if (from && to) return { occurredAt: Between( new Date(from), new Date(to)) };
        if (from) return  {
            occurredAt: MoreThanOrEqual(new Date(from))
        };
        if (to) return {
            occurredAt: LessThanOrEqual(new Date(to))
        };
        return {};
    }
}