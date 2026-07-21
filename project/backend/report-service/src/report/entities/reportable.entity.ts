import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';

@Entity('reportables')
export class Reportable {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column ({unique: true})
    referenceNumber!: string;

    @Column()
    recipient!: string;

    @Column({ nullable: true})
    messageId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}

