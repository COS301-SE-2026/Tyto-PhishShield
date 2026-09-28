import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export enum MistakeCategory {
  VALID_RESPONSE = 'valid_response', // The user has a valid response with no leaked info.
  LOGIN_DETAILS_LEAKED = 'login_details_leaked',
  SECRETS_LEAKED = 'secrets_leaked',
  PII_LEAKED = 'pii_leaked',
  FINANCIAL_INFO_LEAKED = 'financial_info_leaked',
  NEEDS_REVIEW = 'needs_review', // The llm's evaluation is not confident enough to classify the response.
}

export enum Severity {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const SEVERITY_ORDER: Severity[] = [
  Severity.NONE,
  Severity.LOW,
  Severity.MEDIUM,
  Severity.HIGH,
  Severity.CRITICAL,
];

export const MISTAKE_SEVERITY: Record<MistakeCategory, Severity> = {
  [MistakeCategory.VALID_RESPONSE]: Severity.NONE,
  [MistakeCategory.LOGIN_DETAILS_LEAKED]: Severity.HIGH,
  [MistakeCategory.SECRETS_LEAKED]: Severity.CRITICAL,
  [MistakeCategory.PII_LEAKED]: Severity.MEDIUM,
  [MistakeCategory.FINANCIAL_INFO_LEAKED]: Severity.HIGH,
  [MistakeCategory.NEEDS_REVIEW]: Severity.NONE,
};

export class ReplyClassificationDto {
  @IsNotEmpty()
  @IsEnum(MistakeCategory, { each: true })
  categories!: MistakeCategory[];

  @IsNotEmpty()
  @IsEnum(Severity)
  severity!: Severity;

  @IsNotEmpty()
  @IsNumber()
  confidence!: number;

  @IsNotEmpty()
  @IsBoolean()
  needsReview!: boolean;
}
