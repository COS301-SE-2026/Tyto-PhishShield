import { IsNotEmpty, IsString } from 'class-validator';

export class GeneratedTemplateDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  subject!: string;

  @IsNotEmpty()
  @IsString()
  body!: string;
}
