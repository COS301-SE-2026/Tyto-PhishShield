/**
 * LoginDto — request body validation schema for login.
 *
 * - Validates that a login payload contains an email and password.
 */
import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsBoolean()
  sendOTP?: boolean;
}

export class ExtendedLoginDto extends LoginDto {
  @IsString()
  userAgent?: string;

  @IsString()
  ip?: string;

  @IsString()
  deviceToken?: string;
}
