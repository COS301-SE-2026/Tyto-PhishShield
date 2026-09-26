import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Department } from '../entities/user.entity';
import { EventUser } from '@phishshield/dto';

export class User extends EventUser {
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
