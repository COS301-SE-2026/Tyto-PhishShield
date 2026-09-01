import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
} from 'class-validator';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum MessageTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  URGENT = 'urgent',
  AUTHORITATIVE = 'authoritative',
  NEUTRAL = 'neutral',
  APOLOGETIC = 'apologetic',
}

export enum MessageType {
  ANNOUNCEMENT = 'announcement',
  IT_SECURITY_ALERT = 'it_security_alert',
  FINANCE_VOUCHER = 'finance_voucher',
  DOCUMENT_REQUEST = 'document_request',
  EMERGENCY = 'emergency',
  EXECUTIVE_REQUEST = 'executive_request',
  MEETING_INVITE = 'meeting_invite',
  IT_SUPPORT = 'it_support',
  QUESTION = 'question',
}

export enum TemplateVariable {
  NAME = 'name',
  DEPARTMENT = 'department',
}

export class DifficultyLlmGenerationDto {
  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsNotEmpty()
  @IsEnum(MessageTone)
  tone!: MessageTone;

  @IsNotEmpty()
  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TemplateVariable, { each: true })
  templateVariable!: TemplateVariable[];

  @IsInt()
  @Min(1)
  @Max(6)
  count!: number;
}
