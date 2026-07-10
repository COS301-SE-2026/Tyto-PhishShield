import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum XpReason {
  REPORT = 'report', // Best outcome: correctly identified and reported
  DELETE = 'delete', // Safe: deleted without interacting
  QUIZ = 'quiz', // Redemption: completed quiz after a miss
  REFUSED = 'refused', // Partial: replied to refuse (better than clicking, but still interacted)
  IGNORED = 'ignored', // Passive: no interaction after extended time
  COMPROMISED = 'compromised', // Fell for the attack, use with negative amount
}

@Entity('xp')
export class XpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('int')
  amount: number;

  @Column({ nullable: true })
  reason: XpReason;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.xpEntries, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
