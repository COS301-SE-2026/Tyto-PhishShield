import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmMessageIdDto {
  @IsString()
  @IsNotEmpty()
  emailId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
