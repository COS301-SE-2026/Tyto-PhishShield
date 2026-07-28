import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ExtendedVerifyOtpDto extends VerifyOtpDto {
  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}
