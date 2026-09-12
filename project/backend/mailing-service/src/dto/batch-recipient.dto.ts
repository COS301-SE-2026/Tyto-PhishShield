import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchRecipientDto {
  @IsNotEmpty()
  @IsString()
  auth0Id: string;

  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @IsString()
  @IsOptional()
  @Matches(/^[^@\s]+$/)
  senderName?: string;

  @IsString()
  @IsOptional()
  alias?: string;
}
