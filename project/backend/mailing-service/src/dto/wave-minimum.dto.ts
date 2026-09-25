import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class WaveMinimumDto {
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
  @IsNumber()
  numberOfRecipients: number;
}
