import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EmailStatusEnum {
  BOUNCED = 'bounced',
  CLICKED = 'clicked',
  COMPLAINED = 'complained',
  DELIVERED = 'delivered',
  DELIVERED_DELAYED = 'delivered_delayed',
  FAILED = 'failed',
  OPENED = 'opened',
  RECEIVED = 'received',
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  SUPPRESSED = 'suppressed',
}

@Entity('email_status')
export class EmailStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  emailId: string;

  @Index()
  @Column({ nullable: true })
  messageId: string | null;

  @Index()
  @Column()
  auth0Id: string;

  @Column()
  referenceNumber: string;

  @Column({ type: 'enum', enum: EmailStatusEnum })
  status: EmailStatusEnum;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ unique: true, nullable: true })
  webhookEventId: string | null;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
