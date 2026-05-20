/**
 * RegisterDto — request body validation schema for user registration.
 *
 * - Ensures email and password meet basic validation; optional name allowed.
 */
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  name?: string;
}
