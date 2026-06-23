import { IsString, IsArray, IsInt, Min, ArrayMinSize } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    questionText!: string;

    @IsArray()
    @IsString({ each: true})
    @ArrayMinSize(2)
    options!: string[];

    @IsInt()
    @Min(0)
    correctOptionInedx!: number;
}