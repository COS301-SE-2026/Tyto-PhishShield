/**
 * RegisterDto — request body validation schema for user registration.
 *
 * - Ensures email and password meet basic validation; optional name allowed.
 */
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Department } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;
}
