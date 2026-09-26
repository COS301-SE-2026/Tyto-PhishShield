import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Department {
  IT_SECURITY = 'IT & Security',
  FINANCE = 'Finance',
  HR = 'Human Resources',
  LEGAL_COMPLIANCE = 'Legal & Compliance',
  OPERATIONS = 'Operations',
  EXECUTIVE = 'Executive',
}

export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  USER = 'user',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  auth0Id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  department: Department;

  @Column({ nullable: true })
  role: UserRole;
}
