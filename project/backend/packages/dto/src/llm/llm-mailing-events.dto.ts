import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ReplyEmailKind {
  FAILED_DEFAULT = 'failed_default',
  GENERATED = 'generated',
}

export enum Severity {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MistakeCategory {
  VALID_RESPONSE = 'valid_response',
  LOGIN_DETAILS_LEAKED = 'login_details_leaked',
  SECRETS_LEAKED = 'secrets_leaked',
  PII_LEAKED = 'pii_leaked',
  FINANCIAL_INFO_LEAKED = 'financial_info_leaked',
  NEEDS_REVIEW = 'needs_review',
}

export class MistakeDetectedEvent {
  @IsString()
  sender!: string;

  @IsString()
  emailId!: string;

  @IsEnum(MistakeCategory, { each: true })
  @IsArray()
  categories!: MistakeCategory[];

  @IsEnum(Severity)
  severity!: Severity;

  @IsNumber()
  confidence!: number;

  @IsDate()
  occurredAt!: Date;
}

export class SendReplyEmailEvent {
  @IsEnum(ReplyEmailKind)
  kind!: ReplyEmailKind;

  @IsString()
  emailId!: string;

  @IsString()
  to!: string;

  @IsString()
  from!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  originalSubject?: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @IsArray()
  references!: string[];
}

export class ReplyValidatedEvent {
  @IsString()
  emailId!: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  replyText!: string;

  @IsString()
  quotedText!: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @IsArray()
  references!: string[];
}