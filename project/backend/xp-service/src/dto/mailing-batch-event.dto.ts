import { IsNotEmpty, IsString } from 'class-validator';

export class MailingBatchEntryDto {
  @IsString()
  @IsNotEmpty()
  auth0Id: string;

  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsNotEmpty()
  emailId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class MailingBatchEventDto {
  entries: MailingBatchEntryDto[];
}
