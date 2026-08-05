import { XpReason } from '../entities/xp.entity';
import { UserSummaryDto } from './user-summary.dto';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class XpResponseDto {
  @IsString()
  id: string;

  @IsNumber()
  amount: number;

  @IsEnum(XpReason)
  @IsOptional()
  reason: XpReason | null;

  @IsDate()
  createdAt: Date;

  user: UserSummaryDto;
}
