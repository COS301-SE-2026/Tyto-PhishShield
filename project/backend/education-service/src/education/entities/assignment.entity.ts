import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AssignmentStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  auth0Id!: string;

  @Column('simple-array')
  questionIds!: string[];

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status!: AssignmentStatus;

  @Column({ default: 0 })
  xpAwarded!: number;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
