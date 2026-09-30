import {
  IsString,
  IsArray,
  IsInt,
  Min,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @IsString()
  questionText!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  options!: string[];

  @IsInt()
  @Min(0)
  correctOptionIndex!: number;

  @ApiPropertyOptional({
    description:
      'The mistake category this question addresses. Omit for general questions.',
    enum: [
      'login_details_leaked',
      'secrets_leaked',
      'pii_leaked',
      'financial_info_leaked',
    ],
  })
  @IsOptional()
  @IsString()
  category?: string;
}
