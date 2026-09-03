import { Department } from '@phishshield/dto';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsEnum(Department)
  @IsOptional()
  department?: Department;
}
