import { IsEmail } from 'class-validator';
//Deprecated
export class ResendOtpDto {
  @IsEmail()
  email!: string;
}
