import { IsArray, IsEmail, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class SendBatchEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  recipients: string[];
}
