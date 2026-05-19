import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EmailDifficulty } from '../entities/generated-emails.entity';

export class GenerateEmailDto {
  @IsEmail()
  sender: string;

  @IsOptional()
  @IsEmail()
  alias?: string;

  @IsEmail()
  recipient: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  content: string;

  @IsEnum(EmailDifficulty)
  difficulty: EmailDifficulty;
}
