import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Department, MessageType } from './difficulty-llm-generation.dto';

export class GenerateSpearPhishingDto {
  @IsString()
  @IsNotEmpty()
  recipientAuth0Id!: string;

  @IsString()
  @IsNotEmpty()
  senderAuth0Id!: string;

  @IsEnum(Department)
  recipientDepartment!: Department;

  @IsEnum(Department)
  senderDepartment!: Department;

  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsString()
  @IsOptional()
  extraContext?: string;

  @IsDateString()
  @IsOptional()
  scheduledFrom?: string;

  @IsDateString()
  @IsOptional()
  scheduledTo?: string;

  @IsBoolean()
  @IsOptional()
  isManager?: boolean;

  @IsBoolean()
  @IsOptional()
  frequentContact?: boolean;
}
