import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { XpEntity } from './xp.entity';

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
  department: string;

  @OneToMany(() => XpEntity, (xp) => xp.user)
  xpEntries: XpEntity[];
}
