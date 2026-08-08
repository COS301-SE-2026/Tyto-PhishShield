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

    async recordEvent(input: RecordEventInput): Promise<void> {
        const event = this.repo.create(input);
        await this.repo.save(event);
    }
//first will be the overview which will do a count for every event type, later will be the more specific types, but for a more general view we have this part.
    async getOverview(): Promise<{
        totalEmailsSent: number;
        totalReports: number;
        confirmedPhishing: number;
        falsePositives: number;
        totalXpGiven: number;
        educationAssigned: number;
        educationCompleted: number;
    }> {
        const counts = await Promise.all([
            this.count(AnalyticsEventType.EMAIL_SENT),
            this.count(AnalyticsEventType.EMAIL_BATCH_SENT),
            this.count(AnalyticsEventType.REPORT_SUBMITTED),
            this.count(AnalyticsEventType.REPORT_CONFIRMED),
            this.count(AnalyticsEventType.REPORT_FALSE_POSITIVE),
            this.sum(AnalyticsEventType.XP_GIVEN, 'amount'),
            this.count(AnalyticsEventType.EDUCATION_ASSIGNED),
            this.count(AnalyticsEventType.EDUCATION_COMPLETED),
        ]);

        return {
            totalEmailsSent: counts[0] + counts[1],
            totalReports: counts[2],
            confirmedPhishing: counts[3],
            falsePositives: counts[4],
            totalXpGiven: counts[5],
            educationAssigned: counts[6],
            educationCompleted: counts[7],
        };
    }

    async getReportStats(from?: string, to?: string) {
        const where = this.buildDateWhere(from, to);

        const [submitted, confirmed, falsePositive] = await Promise.all([
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_SUBMITTED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_CONFIRMED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE, ...where}}),
        ]);

        const detectionRate = submitted > 0 ? Math.round((confirmed / submitted) * 100) : 0;

        return { submitted, confirmed, falsePositive, detectionRate };

    }

    async getMailingStats(from?: string, to?: string) {
        const where = this.buildDateWhere(from, to);

        const [sent, scheduled, batchSent, batchScheduled] = await Promise.all([
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SENT, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_BATCH_SENT, ...where}}),
            this.repo.count({ where: { eventType: AnalyticsEventType.EMAIL_SCHEDULED, ...where } }),
        ]);

        return {
            totalSent: sent + batchSent,
            scheduled: scheduled + batchScheduled,
        };
    }

    async getUserStats(auth0Id: string) {
        const [reports, confirmed, falsePositive, xpEvents, educationCompleted] = 
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

        return { reports, confirmed, falsePositive, totalXp, educationCompleted };
    }

    async getTimeSeries(from: string, to: string): Promise<{ date: string; reports:number; emailsSent: number; xpGiven: number;}[]> {
        const events = await this.repo.find({
            where: {
                occurredAt: Between(new Date(from), new Date(to)),
            },
            order: { occurredAt: 'ASC'}
        });

        const byDay = new Map<string, { reports: number; emailsSent: number; xpGiven: number }>();

        for (const event of events) {
            const day = event.occurredAt.toISOString().split('T')[0];
            if (!byDay.has(day)) byDay.set(day, { reports: 0, emailsSent: 0, xpGiven: 0 });
            const bucket = byDay.get(day)!;

            if (event.eventType === AnalyticsEventType.REPORT_SUBMITTED) bucket.reports++;
            if ([AnalyticsEventType.EMAIL_SENT,AnalyticsEventType.EMAIL_BATCH_SENT].includes(event.eventType)) bucket.emailsSent++;
            if (event.eventType === AnalyticsEventType.XP_GIVEN) {
                const amount = event.payload?.['amount'];
                bucket.xpGiven += typeof amount === 'number' ? amount : 0;
            }
        }
        return Array.from(byDay.entries()).map(([date, data]) => ({ date, ...data }));
    }

    private async count(eventType: AnalyticsEventType): Promise<number> {
        return this.repo.count({ where: {eventType} });
    }

    private async sum(eventType: AnalyticsEventType, field: string): Promise<number> {
        const events = await this.repo.find({ where: { eventType } });
        return events.reduce((sum, e ) => {
            const val = e.payload?.[field];
            return sum + (typeof val === 'number' ? val : 0);
        }, 0);
    }

    private buildDateWhere(from?: string, to?: string) {
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