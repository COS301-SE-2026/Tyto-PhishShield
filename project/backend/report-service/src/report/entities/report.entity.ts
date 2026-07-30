import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  CONFIRMED_PHISHING = 'confirmed_phishing',
  FALSE_POSITIVE = 'false_positive',
}

@Unique('UQ_report_user_outlook_message', ['auth0Id', 'outlookMessageId'])
@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  auth0Id!: string;

  @Column({ nullable: true })
  reporterEmail?: string;

  @Column({ nullable: true })
  outlookMessageId?: string;

  @Column({ nullable: true })
  emailSubject?: string;

  @Column({ nullable: true })
  emailSender?: string;

  @Column({ nullable: true })
  emailBody?: string;

  @Column({ nullable: true })
  emailReceivedAt?: Date;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
