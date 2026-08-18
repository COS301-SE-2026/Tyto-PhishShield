import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmailDifficulty } from '../entities/email-template.entity';
import { Type } from 'class-transformer';

export class SendBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  auth0Id: string[];

  @IsNotEmpty()
  @IsEnum(EmailDifficulty)
  difficulty: EmailDifficulty;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduledFrom: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduledTo: Date;

  @IsBoolean()
  @IsOptional()
  randomisedTimes: boolean = true;

  @IsString()
  @IsNotEmpty()
  waveName: string;

  @IsString()
  @IsOptional()
  referenceNumber: string;
}
