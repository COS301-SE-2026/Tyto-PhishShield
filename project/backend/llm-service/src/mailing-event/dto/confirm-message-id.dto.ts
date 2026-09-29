import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmMessageIdDto {
  @IsString()
  @IsNotEmpty()
  resendEmailId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
