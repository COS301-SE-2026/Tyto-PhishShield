import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WaveRecipientDto } from './wave-recipient.dto';

export class WaveDto {
  @IsNotEmpty()
  @IsString()
  waveName: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledFrom: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledTo: string;

  @IsNotEmpty()
  @IsBoolean()
  sameEmail: boolean;

  @IsNotEmpty()
  @IsBoolean()
  randomisedTimes: boolean;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaveRecipientDto)
  recipients: WaveRecipientDto[];
}
