import { IsBoolean, isBoolean } from "class-validator";

export class UpdateActiveDto {
    @IsBoolean()
    isActive!: boolean;
}