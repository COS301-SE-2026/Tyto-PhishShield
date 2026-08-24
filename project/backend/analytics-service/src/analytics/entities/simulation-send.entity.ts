import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('simulation_sends')
export class SimulationSend {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true })
  emailId!: string;

  @Index()
  @Column()
  referenceNumber!: string;

  @Index()
  @Column({ nullable: true })
  auth0Id?: string;

  @Index()
  @Column({ nullable: true })
  campaignId?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  sentAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
