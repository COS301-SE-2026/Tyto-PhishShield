/**
 * schedule-single-email.dto.ts
 *
 * This DTO is used as the Body of the schedule-send-single POST request.
 *
 * Elements: recipient, scheduledAt
 */

import { IsNotEmpty, IsDate, IsEmail } from 'class-validator';

export class ScheduleSingleEmailDto {
  // @IsNotEmpty()
  // @IsString()
  // auth0Id: string;

  @IsEmail()
  @IsNotEmpty()
  recipient: string;

  @IsNotEmpty()
  @IsDate()
  scheduledAt: Date;
}
