import {IsArray, IsEnum, IsNotEmpty, IsNumber, IsString} from "class-validator";

export type RecommendationLevel = 'high' | 'medium' | 'low';

export class SenderRecommendation {
    @IsString()
    @IsNotEmpty()
    auth0Id!: string;

    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsNumber()
    @IsNotEmpty()
    score!: number;

    @IsNotEmpty()
    recommendation!: RecommendationLevel;

    @IsArray()
    reasons!: string[];
}