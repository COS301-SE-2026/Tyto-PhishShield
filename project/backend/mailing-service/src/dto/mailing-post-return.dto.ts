/**
 * mailing-post-return.dto.ts
 *
 * This DTO will be used for returns with POST requests in the controllers of mailing-service.
 * This is to avoid sensitive data from being retuned.
 *
 * Elements: success, message, deliveryId, date
 */

import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MailingPostReturnDto {
  @IsBoolean()
  @IsNotEmpty()
  success: boolean;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsDate()
  @Type(() => Date)
  date: Date = new Date();

  constructor(partial: Partial<MailingPostReturnDto>) {
    Object.assign(this, partial);
  }
}
