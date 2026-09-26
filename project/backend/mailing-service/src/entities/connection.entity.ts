import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('connections')
@Index(['senderAuth0Id', 'receiverAuth0Id'], { unique: true })
export class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderAuth0Id: string;

  @Column({ nullable: true })
  senderName: string | null;

  @Column({ nullable: true })
  senderEmail: string | null;

  @Column()
  receiverAuth0Id: string;

  @Column({ nullable: true })
  receiverName: string | null;

  @Column({ nullable: true })
  receiverEmail: string | null;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ nullable: true, type: 'int' })
  threshold: number | null;

  @Column({ default: false })
  isStrong: boolean;

  @Column({ nullable: true })
  source: string | null;

  @Column({ type: 'timestamptz' })
  lastInteractionAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
