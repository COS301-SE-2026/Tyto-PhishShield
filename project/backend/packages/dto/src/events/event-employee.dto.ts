import { IsOptional, IsString } from "class-validator";

export class EventEmployee {
    @IsString()
    auth0Id!: string;

    @IsString()
    @IsOptional()
    managerId?: string;

    @IsString()
    @IsOptional()
    jobTitle?: string;

    @IsString()
    @IsOptional()
    title?: string;
}