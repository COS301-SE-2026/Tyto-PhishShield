import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Department } from '../entities/user.entity';

export class User {
  @IsString()
  id: string;

  @IsString()
  auth0Id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  department: Department;
}
