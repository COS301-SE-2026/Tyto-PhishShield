import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export enum Department {
  IT_SECURITY = 'it_&_security',
  FINANCE = 'finance',
  HR = 'human_resources',
  LEGAL_COMPLIANCE = 'legal_&_compliance',
  OPERATIONS = 'operations',
  EXECUTIVE = 'executive',
}

export class DifficultyLlmGenerationDto {
  @ApiProperty({
    description: 'The complexity level of the phishing template',
    enum: Difficulty,
    example: Difficulty.MEDIUM,
  })
  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiProperty({
    description: 'The overall tone of the generated message',
    enum: MessageTone,
    example: MessageTone.URGENT,
  })
  @IsNotEmpty()
  @IsEnum(MessageTone)
  tone!: MessageTone;

  @ApiProperty({
    description: 'The type or context of the email',
    enum: MessageType,
    example: MessageType.IT_SECURITY_ALERT,
  })
  @IsNotEmpty()
  @IsEnum(MessageType)
  messageType!: MessageType;

  @ApiProperty({
    description: 'List of variables to inject into the template',
    enum: TemplateVariable,
    isArray: true,
    example: [TemplateVariable.NAME, TemplateVariable.DEPARTMENT],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TemplateVariable, { each: true })
  templateVariable!: TemplateVariable[];

  @ApiProperty({
    description: 'Number of templates to generate (1 to 6)',
    minimum: 1,
    maximum: 6,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  count!: number;

  @ApiPropertyOptional({
    description: 'Optional department the email should appear to come from',
    enum: Department,
    example: Department.IT_SECURITY,
  })
  @IsEnum(Department)
  @IsOptional()
  senderDepartment?: Department;
}
