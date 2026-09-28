import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('comms_users')
export class CommsUser {
  @PrimaryColumn()
  auth0Id!: string;

  @Index({ unique: true, where: '"slack_id" IS NOT NULL' })
  @Column({ nullable: true })
  slackId?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ default: true })
  isActive!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
