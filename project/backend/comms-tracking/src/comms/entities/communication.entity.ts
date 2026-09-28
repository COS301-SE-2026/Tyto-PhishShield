import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CommsSource {
  SLACK = 'slack',
  TEAMS = 'teams',
  EMAIL = 'email',
}

@Entity('communications')
@Index(['source', 'externalMessageId'], { unique: true })
export class Communication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: CommsSource })
  source!: CommsSource;

  @Index()
  @Column()
  externalMessageId!: string;

  @Index()
  @Column()
  senderAuth0Id!: string;

  @Column('simple-array')
  receiverAuth0Ids!: string[];

  @Column({ nullable: true })
  channelExternalId?: string;

  @Column({ default: false })
  isReply!: boolean;

  @Column({ nullable: true })
  parentExternalId?: string;

  @Index()
  @Column({ type: 'timestamptz' })
  occurredAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
