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
}