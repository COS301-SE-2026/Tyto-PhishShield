import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity({ name: 'generated_emails', schema: 'mailing' })
export class GeneratedEmail {
  @PrimaryGeneratedColumn('uuid')
  email_id: string;

  @Column({ unique: true })
  reference_number: string;

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
  created_at: Date;
}
