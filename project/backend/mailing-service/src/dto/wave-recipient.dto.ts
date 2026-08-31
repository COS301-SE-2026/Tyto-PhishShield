import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class WaveRecipientDto {
  @IsNotEmpty()
  @IsString()
  auth0Id: string;

  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @IsNotEmpty()
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: Date;
}
