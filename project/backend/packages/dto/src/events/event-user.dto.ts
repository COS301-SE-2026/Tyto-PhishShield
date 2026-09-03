import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Department, UserRole } from '../accounts/enum';

export class EventUser {
  @IsString()
  id!: string;

  @IsString()
  auth0Id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  department!: Department;

  @IsString()
  @IsOptional()
  role!: UserRole;
}
