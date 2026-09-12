import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Department } from './user.entity';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity({ name: 'email_templates' })
export class EmailTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  referenceNumber: string;

  @Column()
  sender: string;

  @Column({ type: 'enum', enum: Department, nullable: true })
  senderDepartment?: Department;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: EmailDifficulty,
    default: EmailDifficulty.MEDIUM,
  })
  difficulty: EmailDifficulty;

  @CreateDateColumn()
  createdAt: Date;
}
