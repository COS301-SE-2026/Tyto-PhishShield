import { IsOptional, IsString } from "class-validator";

export class CreateImportDto {
    @IsOptional()
    @IsString()
    mapping?: string;
}
