import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
    @IsEmail()
    @IsNotEmpty()
    sender: string;

    @IsEmail()
    @IsNotEmpty()
    receiver: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}