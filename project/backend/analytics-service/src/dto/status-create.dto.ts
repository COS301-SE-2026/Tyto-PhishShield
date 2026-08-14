import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmailStatusEnum } from '../email-status/entities/email-status.entity';
import { Type } from 'class-transformer';

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

  @Type(() => Date)
  @IsDate()
  occurredAt: Date;
}
