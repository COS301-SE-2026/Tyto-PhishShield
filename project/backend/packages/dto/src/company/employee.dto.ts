import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class EmployeeDto {
    @IsString()
    employeeId!: string;    //'Employee-Number Field',

    @IsString()
    @IsEmail()
    email!: string;         //'Work-Email Field',

    @IsString()
    @IsOptional()
    firstName?: string;     //'First-Name Field',

    @IsString()
    @IsOptional()
    lastName?: string;      //'Surname Field',

    @IsString()
    @IsOptional()
    department?: string;    //'Department Field',

    @IsString()
    @IsOptional()
    jobTitle?: string;      //'Job-Title Field',

    @IsString()
    @IsOptional()
    managerId?: string;     //'Manager-ID Field',

    @IsString()
    @IsOptional()
    employeeStatus?: string;//'Employment-Status Field',

    @IsString()
    @IsOptional()
    externalId?: string;    //'HR-Employee-ID Field',

    @IsBoolean()
    @IsOptional()
    registered?: boolean;
}