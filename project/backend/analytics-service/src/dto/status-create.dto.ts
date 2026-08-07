import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmailStatusEnum } from '../entities/email-status.entity';

export class StatusCreateDto {
  @IsString()
  emailId: string;

  @IsString()
  @IsOptional()
  messageId: string | null;

  @IsString()
  auth0Id: string;

  @IsEnum(EmailStatusEnum)
  status: EmailStatusEnum;

  @IsString()
  @IsOptional()
  reason: string | null;

  @IsString()
  @IsOptional()
  webhookEventId: string | null;

  @IsDate()
  occurredAt: Date;
}
