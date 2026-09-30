import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Department } from '@phishshield/dto';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class EmailsDto {
  @IsNotEmpty()
  sender!: string;

  @IsNotEmpty()
  subject!: string;

  @IsNotEmpty()
  content!: string;

  @IsEnum(EmailDifficulty)
  difficulty!: EmailDifficulty;

  @IsEnum(Department)
  @IsOptional()
  senderDepartment?: Department;
}
