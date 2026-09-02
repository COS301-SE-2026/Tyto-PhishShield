import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { EmailStatusEnum } from '../email-status/entities/email-status.entity';


export class StatusCreateDto {
  @IsString()
  emailId: string;

  @IsString()
  messageId: string;

  @IsEnum(EmailStatusEnum)
  status: EmailStatusEnum;

  @IsString()
  @IsOptional()
  reason: string | null;

  @IsString()
  webhookEventId: string;

  @IsDateString()
  occurredAt: string;
}
