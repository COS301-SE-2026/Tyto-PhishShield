import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index,
} from 'typeorm';

export enum AnalyticsEventType {
    REPORT_SUBMITTED = 'report_submitted',
    REPORT_CONFIRMED = 'report_confirmed',
    REPORT_FALSE_POSITIVE = 'report_false_positive',
    EMAIL_SENT = 'email_sent',
    EMAIL_SCHEDULED = 'email_scheduled',
    EMAIL_BATCH_SENT = 'email_batch_sent',
    XP_GIVEN = 'xp_give',
    EDUCATION_ASSIGNED = 'education_assigned',
    EDUCATION_COMPLETED = 'education_completed',
}

@Entity('analytics_events')
export class AnalyticsEvent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'enum', enum: 'AnalyticsEventType' })
    eventType!: AnalyticsEventType;

    @Index()
    @Column({ nullable: true})
    auth0Id?: string;

    @Column({ nullable: true})
    email?: string;

    @Column({ type: 'jsonb', nullable: true})
    payload?: Record<string, unknown>;

    @Index()
    @CreateDateColumn()
    occurredAt!: Date; 

}