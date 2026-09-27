import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Department } from '../entities/user.entity';
import { UserRole } from '@phishshield/dto';

export class User {
  @IsString()
  id!: string;

  @IsString()
  auth0Id!: string;

  @IsString()
  name!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  department!: Department;

  @IsString()
  @IsOptional()
  role?: UserRole;
}
