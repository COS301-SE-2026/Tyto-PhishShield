import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EmailStatusEnum {
  BOUNCED = 'email.bounced',
  CLICKED = 'email.clicked',
  COMPLAINED = 'email.complained',
  DELIVERED = 'email.delivered',
  DELIVERED_DELAYED = 'email.delivered_delayed',
  FAILED = 'email.failed',
  OPENED = 'email.opened',
  RECEIVED = 'email.received',
  REQUESTED = 'email.requested',
  SCHEDULED = 'email.scheduled',
  SENT = 'email.sent',
  SUPPRESSED = 'email.suppressed',
}

@Entity('email_status')
export class EmailStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  emailId: string;

  @Index()
  @Column()
  messageId: string;

  @Column({ type: 'enum', enum: EmailStatusEnum })
  status: EmailStatusEnum;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ unique: true })
  webhookEventId: string;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
