import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('analytics_users')
export class AnalyticsUser {
  @PrimaryColumn()
  auth0Id!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  role?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
