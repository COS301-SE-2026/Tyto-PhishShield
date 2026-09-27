import { IsEnum } from 'class-validator';

export enum ReviewDecision {
  LEAK = 'leak',
  NO_LEAK = 'no_leak',
}

export class ResolveReviewDto {
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;
}
