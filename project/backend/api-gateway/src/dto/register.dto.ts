import { RegisterDto } from "@phishshield/dto";
import { IsString } from "class-validator";

export class ApiRegisterDto extends RegisterDto {
    @IsString()
    employeeId!: string;
}