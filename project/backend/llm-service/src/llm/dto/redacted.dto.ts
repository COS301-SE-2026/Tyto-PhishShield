import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum RedactionItemType {
  NAME = 'name',
  BUSINESS_NAME = 'business_name',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  ID_NUMBER = 'id_number',
  OTHER = 'other',
}

export class RawRedactionItem {
  @IsOptional()
  text?: unknown;

  @IsOptional()
  type?: unknown;
}

export class RedactionItem {
  @IsString()
  text!: string;

  @IsEnum(RedactionItemType)
  type: RedactionItemType;
}

export class RedactionResult {
  @IsString()
  redactedText!: string;

  @IsEnum(RedactionItemType, { each: true })
  items!: RedactionItem[];
}
