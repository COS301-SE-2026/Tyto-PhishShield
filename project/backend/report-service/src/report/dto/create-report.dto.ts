import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsOptional()
  outlookMessageId!: string;

  @IsString()
  @IsOptional()
  emailSubject?: string;

  @IsString()
  @IsOptional()
  emailSender?: string;

  @IsString()
  @IsOptional()
  emailBody?: string;

  @IsDateString()
  @IsOptional()
  emailReceivedAt?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}
