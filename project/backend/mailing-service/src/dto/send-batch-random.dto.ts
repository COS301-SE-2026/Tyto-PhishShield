import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailDifficulty } from '../entities/email-template.entity';

export class SendBatchRandomDto {
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
}
