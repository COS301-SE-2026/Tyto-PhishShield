import {IsNotEmpty, IsOptional, IsString} from "class-validator";

export class SendSpearPhishingEvent {
    @IsString()
    @IsNotEmpty()
    recipientAuth0Id!: string;

    @IsString()
    @IsNotEmpty()
    senderAuth0Id!: string;

    @IsString()
    @IsNotEmpty()
    subject!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsString()
    @IsOptional()
    scheduledFrom?: string;

    @IsString()
    @IsOptional()
    scheduledTo?: string;
}