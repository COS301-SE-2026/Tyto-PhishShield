import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EmailDifficulty } from '../entities/emails.entity';

export class EmailsDto {
  @IsEmail()
  sender: string;

  @IsOptional()
  alias?: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  content: string;

  @IsEnum(EmailDifficulty)
  difficulty: EmailDifficulty;
}
