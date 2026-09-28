import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
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
  scheduledFrom!: string;

  @IsDateString()
  scheduledTo!: string;
}
