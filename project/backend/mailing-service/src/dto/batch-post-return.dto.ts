import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchPostReturnDto {
  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsDate()
  @Type(() => Date)
  date: Date = new Date();

  constructor(partial: Partial<BatchPostReturnDto>) {
    Object.assign(this, partial);
  }
}
