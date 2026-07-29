import { IsNumber } from 'class-validator';
import { UserSummaryDto } from './user-summary.dto';

export class NetXpResponseDto {
  @IsNumber()
  totalXp: number;

  user: UserSummaryDto;
}
