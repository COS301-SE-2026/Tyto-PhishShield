import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResendBatchItemDto {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString({ each: true })
  to: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
