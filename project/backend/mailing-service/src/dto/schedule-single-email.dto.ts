/**
 * schedule-single-email.dto.ts
 *
 * This DTO is used as the Body of the schedule-send-single POST request.
 *
 * Elements: auth0Id, emailReferenceNumber, scheduledAt
 */

import { IsNotEmpty, IsString, IsDate } from 'class-validator';

export class ScheduleSingleEmailDto {
  @IsNotEmpty()
  @IsString()
  auth0Id: string;

  @IsNotEmpty()
  @IsString()
  emailReferenceNumber: string;

  @IsNotEmpty()
  @IsDate()
  scheduledAt: Date;
}
