import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity({ name: 'emails' })
export class Emails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  referenceNumber: string;

  @Column()
  sender: string;

  @Column({ nullable: true })
  alias?: string;

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
