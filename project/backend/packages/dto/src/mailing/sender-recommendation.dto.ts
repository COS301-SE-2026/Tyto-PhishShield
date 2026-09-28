import {IsArray, IsEnum, IsNotEmpty, IsNumber, IsString} from "class-validator";
import {Department} from "../accounts/enum";

export type RecommendationLevel = 'high' | 'medium' | 'low';

export class SenderRecommendation {
    @IsString()
    @IsNotEmpty()
    auth0Id!: string;

    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsEnum(Department)
    @IsNotEmpty()
    department!: Department;

    @IsNumber()
    @IsNotEmpty()
    score!: number;

    @IsNotEmpty()
    recommendation!: RecommendationLevel;

    @IsArray()
    reasons!: string[];
}