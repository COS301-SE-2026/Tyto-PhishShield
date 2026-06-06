import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn} from 'typeorm';

@Entity('otps')
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    email!:string;

    @Column()
    code!: string;

    @Column()
    expiresAt!: Date;

    @Column({ default: false})
    used!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}