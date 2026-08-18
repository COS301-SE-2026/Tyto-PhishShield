import { IsDate, IsNotEmpty, IsString } from 'class-validator';
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
}
