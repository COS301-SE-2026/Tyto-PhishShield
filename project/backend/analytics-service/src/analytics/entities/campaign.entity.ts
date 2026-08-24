import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ type: 'jsonb', nullable: true })
  targetDepartments?: string[];

  @Column({ nullable: true, type: 'timestamptz' })
  startDate?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  endDate?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
