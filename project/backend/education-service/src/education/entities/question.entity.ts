import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  questionText!: string;

  @Column('simple-array')
  options!: string[];

  @Column()
  correctOptionIndex!: number;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
