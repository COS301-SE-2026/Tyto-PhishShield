/**
 * schedule-single-email.dto.ts
 *
 * This DTO is used as the Body of the schedule-send-single POST request.
 *
 * Elements: recipient, scheduledAt
 */

import { IsNotEmpty, IsDate, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSingleEmailDto {
  // @IsNotEmpty()
  // @IsString()
  // auth0Id: string;

  @IsEmail()
  @IsNotEmpty()
  recipient: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;
}
