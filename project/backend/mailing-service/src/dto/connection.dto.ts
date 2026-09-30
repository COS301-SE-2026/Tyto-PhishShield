import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsEmail,
} from 'class-validator';

export class CreateConnectionDto {
  @IsString()
  senderAuth0Id!: string;

  @IsString()
  @IsOptional()
  senderName?: string;

  @IsEmail()
  @IsOptional()
  senderEmail?: string;

  @IsString()
  receiverAuth0Id!: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsEmail()
  @IsOptional()
  receiverEmail?: string;

  @IsInt()
  @IsOptional()
  messageCount?: number;

  @IsInt()
  @IsOptional()
  threshold?: number;

  @IsBoolean()
  @IsOptional()
  isStrong?: boolean;

  @IsString()
  @IsOptional()
  source?: string;

  @IsDateString()
  @IsOptional()
  lastInteractionAt?: string;
}

export class UpdateConnectionDto {
  @IsString()
  @IsOptional()
  senderName?: string;

  @IsEmail()
  @IsOptional()
  senderEmail?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsEmail()
  @IsOptional()
  receiverEmail?: string;

  @IsInt()
  @IsOptional()
  messageCount?: number;

  @IsInt()
  @IsOptional()
  threshold?: number;

  @IsBoolean()
  @IsOptional()
  isStrong?: boolean;

  @IsString()
  @IsOptional()
  source?: string;

  @IsDateString()
  @IsOptional()
  lastInteractionAt?: string;
}

export const COMMS_EVENT_EXCHANGE = 'comms-event-exchange';

export interface CommunicationRecordedEvent {
  source: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  occurredAt: string;
}

export interface StrongConnectionEvent {
  senderAuth0Id: string;
  senderEmail: string | null;
  senderName: string | null;
  receiverAuth0Id: string;
  receiverEmail: string | null;
  receiverName: string | null;
  messageCount: number;
  threshold: number;
  lastInteractionAt: string;
}
