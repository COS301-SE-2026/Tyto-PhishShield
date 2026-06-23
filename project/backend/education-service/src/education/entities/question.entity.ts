import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
    UsingJoinColumnIsNotAllowedError,
} from 'typeorm'

@Entity('questions')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    questionText!: string;

    @Column('simple-array')
    options!: string[];

    @Column()
    correctOptionIndex!: number;

    @CreateDateColumn()
    createdAt!: Date;
}