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
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailDifficulty } from "./emails.dto";

export class SendBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  auth0Id!: string[];

  @IsNotEmpty()
  @IsEnum(EmailDifficulty)
  difficulty!: EmailDifficulty;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduledFrom!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  scheduledTo!: Date;

  @IsBoolean()
  @IsOptional()
  randomisedTimes?: boolean = true;

  @IsString()
  @IsNotEmpty()
  waveName!: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[^@\s]+$/)
  senderCustomName?: string;

  @IsString()
  @IsOptional()
  senderAuth0Id?: string;

  @IsString()
  @IsOptional()
  alias?: string;
}
