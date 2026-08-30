import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WaveRecipientEntity } from './wave-recipient.entity';

@Entity('waves')
export class WaveEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  waveName: string;

  @Column({ type: 'timestamptz' })
  scheduledFrom: Date;

  @Column({ type: 'timestamptz' })
  scheduledTo: Date;

  @Column({ default: false })
  sameEmail: boolean;

  @Column({ default: false })
  randomisedTimes: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => WaveRecipientEntity, (recipient) => recipient.wave, {
    cascade: true,
  })
  recipients: WaveRecipientEntity[];
}
