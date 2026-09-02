/**
 * User entity — maps to the users table in the accounts service database.
 *
 * - Defines persisted fields for a registered user and role information.
 */
import { Department, UserRole } from '@phishshield/dto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  department!: Department;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
