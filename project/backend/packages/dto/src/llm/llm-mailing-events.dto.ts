import {IsArray, IsDate, IsEnum, IsNumber, IsString} from "class-validator";

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
  VALID_RESPONSE = 'valid_response', // The user has a valid response with no leaked info.
  LOGIN_DETAILS_LEAKED = 'login_details_leaked',
  SECRETS_LEAKED = 'secrets_leaked',
  PII_LEAKED = 'pii_leaked',
  FINANCIAL_INFO_LEAKED = 'financial_info_leaked',
  NEEDS_REVIEW = 'needs_review', // The llm's evaluation is not confident enough to classify the response.
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

    @IsString()
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

    @IsString()
    subject!: string;

    @IsString()
    content!: string;

    @IsString()
    inReplyTo!: string

    @IsArray()
    references!: string[];
}

export class ReplyReviewNeededEvent {
    @IsString()
    emailId!: string;

    @IsString()
    sender!: string;

    @IsString()
    inReplyTo!: string

    @IsArray()
    references!: string[];

    @IsEnum(MistakeCategory, { each: true })
    categories!: MistakeCategory[];

    @IsEnum(Severity)
    severity!: Severity;

    @IsNumber()
    confidence!: number;

    @IsDate()
    occurredAt!: Date;
}