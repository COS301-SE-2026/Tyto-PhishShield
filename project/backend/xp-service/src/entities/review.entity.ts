import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MistakeCategory, Severity, ReviewType } from '@phishshield/dto';

export enum ReviewResolution {
  LEAK = 'leak',
  NO_LEAK = 'no_leak',
}

@Entity('review')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  emailId!: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column({ type: 'enum', enum: ReviewType })
  reviewType!: ReviewType;

  @Column()
  sender!: string;

  @Column()
  businessAddress!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text', nullable: true })
  replyBody?: string;

  @Column({ type: 'text', nullable: true })
  quotedText?: string;

  @Column({ nullable: true })
  inReplyTo?: string;

  @Column('simple-array', { default: '' })
  references!: string[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: { id: string; filename: string; contentType: string }[];

  @Column({ type: 'enum', enum: MistakeCategory, array: true, nullable: true })
  categories?: MistakeCategory[];

  @Column({ type: 'enum', enum: Severity, nullable: true })
  severity?: Severity;

  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @Column({ default: false })
  resolved!: boolean;

  @Column({ type: 'enum', enum: ReviewResolution, nullable: true })
  resolution?: ReviewResolution;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;
}
