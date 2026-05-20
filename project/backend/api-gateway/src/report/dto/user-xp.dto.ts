import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UserXpDto {
  @IsString()
  userId!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
