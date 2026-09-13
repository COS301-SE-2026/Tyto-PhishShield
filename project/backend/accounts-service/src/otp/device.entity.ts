import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('VerifiedDevices')
export class VerifiedDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  tokenHash!: string;

  @Column()
  userAgent!: string;

  @Column()
  ipCreated!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  lastUsedAt!: Date;

  @Column()
  expiresAt!: Date;
}
