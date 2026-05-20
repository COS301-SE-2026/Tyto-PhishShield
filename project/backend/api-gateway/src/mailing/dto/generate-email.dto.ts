import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum EmailDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class GenerateEmailDto {
  @IsEmail()
  sender!: string;

  @IsOptional()
  alias?: string;

  @IsEmail()
  recipient!: string;

  @IsNotEmpty()
  subject!: string;

  @IsNotEmpty()
  content!: string;

  @IsEnum(EmailDifficulty)
  difficulty!: EmailDifficulty;
}
