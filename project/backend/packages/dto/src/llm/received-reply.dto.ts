import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReceivedReplyAttachmentDto {
  @IsString()
  id!: string;

  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;
}

export class ReceivedReplyDto {
  @IsNotEmpty()
  @IsString()
  webhookEventId!: string;

  @IsISO8601()
  receivedAt!: string;

  @IsNotEmpty()
  @IsString()
  emailId!: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsString()
  from!: string;

  @IsArray()
  @IsString({ each: true })
  to!: string[];

  @IsArray()
  @IsString({ each: true })
  cc!: string[];

  @IsArray()
  @IsString({ each: true })
  bcc!: string[];

  @IsString()
  subject!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedReplyAttachmentDto)
  attachments!: ReceivedReplyAttachmentDto[];
}