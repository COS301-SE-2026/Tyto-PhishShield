import { MistakeCategory } from '@phishshield/dto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('incorrect-question')
export class IncorrectQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  auth0Id!: string;

  @Column()
  questionId!: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  category?: MistakeCategory | null;

  @CreateDateColumn()
  createdAt!: Date;
}
