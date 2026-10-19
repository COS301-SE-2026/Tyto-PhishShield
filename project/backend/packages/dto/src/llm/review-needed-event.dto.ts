import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MistakeCategory, Severity } from './llm-mailing-events.dto';

export enum ReviewType {
  ATTACHMENT = 'attachment',
  NEEDS_REVIEW = 'needs_review',
  BOTH = 'both',
}

export class ReviewAttachmentDto {
  @IsString()
  id!: string;

  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;
}

export class ReviewNeededEvent {
  @IsEnum(ReviewType)
  reviewType!: ReviewType;

  @IsNotEmpty()
  @IsString()
  emailId!: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsString()
  sender!: string;

  @IsString()
  businessAddress!: string;

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @IsArray()
  @IsString({ each: true })
  references!: string[];

  @IsOptional()
  @IsString()
  replyBody?: string;

  @IsOptional()
  @IsString()
  quotedText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewAttachmentDto)
  attachments?: ReviewAttachmentDto[];

  @IsOptional()
  @IsEnum(MistakeCategory, { each: true })
  @IsArray()
  categories?: MistakeCategory[];

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsDate()
  occurredAt!: Date;
}