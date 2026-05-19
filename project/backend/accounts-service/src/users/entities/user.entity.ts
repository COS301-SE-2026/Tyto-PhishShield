import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  auth0Id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ default: false })
  isOtpVerified!: boolean;

  @Column({ nullable: true })
  otpCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
