import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Import } from '../../import/entities/import.entity';

@Entity('employee-entity')
export class Employee {
  @PrimaryColumn({ unique: true, nullable: false })
  employeeId!: string;

  @Index()
  @Column()
  email!: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  jobTitle?: string;

  @Index()
  @Column({ nullable: true })
  managerId?: string;

  @Column({ nullable: true })
  employeeStatus?: string;

  @Column({ nullable: true })
  externalId?: string;

  @Column({default: false})
  registered!: boolean;

  @CreateDateColumn()
  dateImported!: Date;

  @ManyToOne(() => Import, (importRecord) => importRecord.employees, {
    nullable: false,
  })
  @JoinColumn({ name: 'import_id' })
  import?: Import;
}
