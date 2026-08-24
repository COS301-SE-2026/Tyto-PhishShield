import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  referenceNumber!: string;

  @Index()
  @Column({ nullable: true })
  auth0Id?: string;

  @Column({ nullable: true })
  campaignId?: string;

  @CreateDateColumn()
  clickedAt!: Date;
}
