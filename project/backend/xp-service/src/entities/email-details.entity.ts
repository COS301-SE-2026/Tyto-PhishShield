import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('email_details')
export class EmailDetailsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column()
  auth0Id: string;

  @Column()
  referenceNumber: string;

  @Column()
  emailId: string;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ nullable: true })
  waveId: string | null;

  @Column({ default: false })
  clicked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
