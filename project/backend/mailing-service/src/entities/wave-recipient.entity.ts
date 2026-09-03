import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WaveEntity } from './wave.entity';

@Entity('wave_recipients')
export class WaveRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  auth0Id: string;

  @Column()
  referenceNumber: string;

  @Column({ nullable: true })
  emailId: string;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @ManyToOne(() => WaveEntity, (wave) => wave.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'waveId' })
  wave: WaveEntity;
}
