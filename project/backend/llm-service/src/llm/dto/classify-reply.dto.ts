import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClassifyReplyDto {
  @IsNotEmpty()
  @IsString()
  replyText!: string;

  @IsOptional()
  @IsString()
  originalSubject?: string;
}
