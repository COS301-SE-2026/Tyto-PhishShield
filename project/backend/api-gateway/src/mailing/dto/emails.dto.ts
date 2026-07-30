import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class EmailsDto {
  @IsEmail()
  sender!: string;

  @IsOptional()
  alias?: string;

  @IsNotEmpty()
  subject!: string;

  @IsNotEmpty()
  content!: string;

  @IsEnum(EmailDifficulty)
  difficulty!: EmailDifficulty;
}
