import { GeneratedTemplateDto } from './generated-template.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GeneratedTemplatesResponseDto {
  @IsNotEmpty()
  @IsNumber()
  requested: number;

  @IsNotEmpty()
  @IsNumber()
  generated: number;

  @IsNotEmpty()
  @IsNumber()
  failed: number;

  templates: GeneratedTemplateDto[];
}
