import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Employee } from "../../employee/entities/employee.entity";
import { ImportType } from '../types/import.types';

@Entity('import-entity')
export class Import {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column()
    authIdImportedBy!: string;

    @Index()
    @Column()
    fileName!: string;

    @Column()
    fileType!: string;

    @Column()
    fileSize!: number;

    @Column({
        type: 'enum',
        enum: ImportType,
        default: ImportType.CSV,
    })
    importType!: ImportType;

    @Column({ type: 'jsonb', nullable: true })
    mapping?: Record<string, string> | null;

    @Column({nullable: true})
    totalRows?: number;

    @Column({nullable: true})
    processedRows?: number;

    @Column({nullable: true})
    status?: boolean;

    @Column({nullable: true})
    addedEmployees?: number;

    @Column({nullable: true})
    updatedEmployees?: number;

    @CreateDateColumn()
    dateImported!: Date;

    @UpdateDateColumn()
    dateUpdated!: Date;

    @OneToMany(() => Employee, (employee) => employee.employeeId)
    employees!: Employee[];
}
