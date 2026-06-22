/**
 * schedule-single-email.dto.ts
 *
 * This DTO is used as the Body of the schedule-send-single POST request.
 *
 * Elements: recipient, scheduledAt
 */

import { IsNotEmpty, IsDateString, IsEmail } from 'class-validator';

export class ScheduleSingleEmailDto {
  // @IsNotEmpty()
  // @IsString()
  // auth0Id: string;

  @IsEmail()
  @IsNotEmpty()
  recipient: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;
}
