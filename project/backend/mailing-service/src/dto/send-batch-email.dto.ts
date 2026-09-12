import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';

export class SendBatchEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  auth0Id: string[];

  @IsString()
  @IsOptional()
  @Matches(/^[^@\s]+$/)
  senderName?: string;

  @IsString()
  @IsOptional()
  alias?: string;
}
