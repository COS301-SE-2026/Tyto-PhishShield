import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { XpEntity } from './xp.entity';

export enum Department {
  IT_SECURITY = 'IT & Security',
  FINANCE = 'Finance',
  HR = 'Human Resources',
  LEGAL_COMPLIANCE = 'Legal & Compliance',
  OPERATIONS = 'Operations',
  EXECUTIVE = 'Executive',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  auth0Id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  department: Department;

  @OneToMany(() => XpEntity, (xp) => xp.user)
  xpEntries: XpEntity[];
}
