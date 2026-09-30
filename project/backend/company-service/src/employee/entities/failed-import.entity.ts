import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('failed-import-entity')
export class FailedImport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  data!: string;

  @Column()
  errorMessage!: string;
}
