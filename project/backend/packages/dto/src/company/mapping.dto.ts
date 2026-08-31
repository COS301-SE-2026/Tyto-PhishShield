import { IsOptional, IsString } from "class-validator";
import { EmployeeDto } from "./employee.dto";

export class MappingDto extends EmployeeDto {
    @IsString()
    @IsOptional()
    managerEmail?: string;  //'Manager-Email Field',
}