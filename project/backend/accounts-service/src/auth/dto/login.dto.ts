/**
 * LoginDto — request body validation schema for login.
 *
 * - Validates that a login payload contains an email and password.
 */
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
//Deprecated
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsBoolean()
  @IsOptional()
  sendOTP?: boolean;

  @IsString()
  @IsOptional()
  deviceToken?: string;
}
