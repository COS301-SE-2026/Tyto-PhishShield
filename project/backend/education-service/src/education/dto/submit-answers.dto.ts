import { IsString, IsArray, IsInt } from 'class-validator';

export class SubmitAnswersDto {
  @IsString()
  assignmentId!: string;

  @IsArray()
  @IsInt({ each: true })
  answers!: number[];
}
