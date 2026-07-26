/**
 * LoginDto — request body validation schema for login.
 *
 * - Validates that a login payload contains an email and password.
 */
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsBoolean()
  @IsOptional()
  sendOTP?: boolean;
}

export class ExtendedLoginDto extends LoginDto {
  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  deviceToken?: string;
}
