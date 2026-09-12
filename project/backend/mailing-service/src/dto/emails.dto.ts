import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EmailDifficulty } from '../entities/email-template.entity';
import { Department } from '@phishshield/dto';

export class EmailsDto {
  @IsEmail()
  sender: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  content: string;

  @IsEnum(EmailDifficulty)
  difficulty: EmailDifficulty;

  @IsEnum(Department)
  @IsOptional()
  senderDepartment?: Department;
}
