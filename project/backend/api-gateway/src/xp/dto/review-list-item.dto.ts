import { ReviewType, MistakeCategory, Severity } from '@phishshield/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReviewAttachmentLinkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  size!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  downloadUrl!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiresAt!: string;
}

export class ReviewUserSummaryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  auth0Id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string;
}

export class ReviewListItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ enum: ReviewType })
  @IsEnum(ReviewType)
  @IsNotEmpty()
  reviewType!: ReviewType;

  @ApiProperty({ type: ReviewUserSummaryDto, nullable: true })
  user!: ReviewUserSummaryDto | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ type: [ReviewAttachmentLinkDto] })
  attachments!: ReviewAttachmentLinkDto[];

  @ApiPropertyOptional({ enum: MistakeCategory, isArray: true })
  categories?: MistakeCategory[];

  @ApiPropertyOptional({ enum: Severity })
  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt!: Date;
}
