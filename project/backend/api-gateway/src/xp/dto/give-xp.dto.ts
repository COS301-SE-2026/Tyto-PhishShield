import { IsString, IsInt, IsOptional } from 'class-validator';
export enum XpReason {
  REPORT = 'report', // Best outcome: correctly identified and reported
  DELETE = 'delete', // Safe: deleted without interacting
  QUIZ = 'quiz', // Redemption: completed quiz after a miss
  REFUSED = 'refused', // Partial: replied to refuse (better than clicking, but still interacted)
  IGNORED = 'ignored', // Passive: no interaction after extended time
  COMPROMISED = 'compromised', // Fell for the attack — use with negative amount
}
export class GiveXpDto {
  @IsString()
  auth0Id!: string;

  @IsInt()
  amount!: number;

  @IsString()
  @IsOptional()
  reason?: XpReason;
}
