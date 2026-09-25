import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class BatchSendResultDto {
  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @IsNotEmpty()
  @IsString()
  message: string;
}
