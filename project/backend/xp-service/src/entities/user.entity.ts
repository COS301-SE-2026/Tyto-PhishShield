import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { XpEntity } from './xp.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn()
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
