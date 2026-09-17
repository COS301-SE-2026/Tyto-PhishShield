import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('connections')
@Index(['senderAuth0Id', 'receiverAuth0Id'], { unique: true })
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  senderAuth0Id!: string;

  @Column()
  receiverAuth0Id!: string;

  @Column({ default: 0 })
  messageCount!: number;

  @Column({ type: 'timestamptz' })
  firstInteractionAt!: Date;

  @Index()
  @Column({ type: 'timestamptz' })
  lastInteractionAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}