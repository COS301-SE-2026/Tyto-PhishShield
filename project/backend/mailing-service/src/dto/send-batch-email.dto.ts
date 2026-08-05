import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

export class SendBatchEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString()
  auth0Id: string[];
}
