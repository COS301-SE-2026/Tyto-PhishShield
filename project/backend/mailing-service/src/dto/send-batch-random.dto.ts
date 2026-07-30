import {
  IsArray,
  IsEmail,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailDifficulty } from '../entities/emails.entity';

export class SendBatchRandomDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  recipients: string[];

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
