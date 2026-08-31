import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Department } from '../../users/entities/user.entity';

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
