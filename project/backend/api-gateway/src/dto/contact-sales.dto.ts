import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactSalesDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsEmail()
  workEmail!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
