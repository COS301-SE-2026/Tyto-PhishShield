import { ReviewType, MistakeCategory, Severity } from '@phishshield/dto';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReviewAttachmentLinkDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsNumber()
  @IsNotEmpty()
  size!: number;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsNotEmpty()
  downloadUrl!: string;

  @IsString()
  @IsNotEmpty()
  expiresAt!: string;
}

export class ReviewUserSummaryDto {
  @IsString()
  @IsNotEmpty()
  auth0Id!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  department?: string;
}

export class ReviewListItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsEnum(ReviewType)
  @IsNotEmpty()
  reviewType!: ReviewType;

  user!: ReviewUserSummaryDto | null;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  attachments: ReviewAttachmentLinkDto[];
  categories?: MistakeCategory[];

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsNumber()
  @IsOptional()
  confidence?: number;

  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
