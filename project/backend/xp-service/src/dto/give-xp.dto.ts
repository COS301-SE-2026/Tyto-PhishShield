import { IsString, IsInt, IsOptional } from 'class-validator';
import { XpReason } from '../entities/xp.entity';

export class GiveXpDto {
  @IsString()
  auth0Id: string;

  @IsInt()
  amount: number;

  @IsString()
  @IsOptional()
  reason: XpReason;
}
