import { IsEmail, IsOptional, IsString } from 'class-validator';

export class EventUser {
  @IsString()
  id!: string;

  @IsString()
  auth0Id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  department!: string;
}
