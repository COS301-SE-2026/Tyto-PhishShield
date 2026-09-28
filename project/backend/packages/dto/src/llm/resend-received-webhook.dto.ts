import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ResendInboundAttachmentDto {

  @IsString()
  id!: string;


  @IsString()
  filename!: string;

  @IsString()
  content_type!: string;
}

export class ResendReceivedDataDto {

  @IsString()
  email_id!: string;


  @IsOptional()
  @IsString()
  message_id?: string;


  @IsString()
  from!: string;


  @IsArray()
  @IsString({ each: true })
  to!: string[];


  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc?: string[];


  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bcc?: string[];

  @IsString()
  subject!: string;


  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResendInboundAttachmentDto)
  attachments?: ResendInboundAttachmentDto[];
}

export class ResendReceivedWebhookPayloadDto {

  @IsString()
  type!: string;


  @IsString()
  created_at!: string;


  @ValidateNested()
  @Type(() => ResendReceivedDataDto)
  data!: ResendReceivedDataDto;
}