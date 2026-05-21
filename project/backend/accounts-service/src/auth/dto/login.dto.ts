/**
 * LoginDto — request body validation schema for login.
 *
 * - Validates that a login payload contains an email and password.
 */
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
