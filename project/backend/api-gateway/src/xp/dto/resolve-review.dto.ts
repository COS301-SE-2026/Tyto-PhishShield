import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewDecision {
  LEAK = 'leak',
  NO_LEAK = 'no_leak',
}

export class ResolveReviewDto {
  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;
}
