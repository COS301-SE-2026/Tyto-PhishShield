/**
 * send-single-email.dto.ts
 *
 * This DTO is used as the Body of the send-single POST request.
 *
 * Elements: recipient, emailReferenceNumber
 */

import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendSingleEmailDto {
  // @IsNotEmpty()
  // @IsString()
  // auth0Id: string;

  @IsEmail()
  @IsNotEmpty()
  recipient: string;
}
