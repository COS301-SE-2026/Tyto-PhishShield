import { IsEmail } from 'class-validator';

export class ResendOtpDto {
  @IsEmail()
  email!: string;
}
