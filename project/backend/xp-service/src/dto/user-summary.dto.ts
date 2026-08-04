import { IsEmail, IsString } from 'class-validator';

export class UserSummaryDto {
  @IsString()
  auth0Id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  department: string;
}
