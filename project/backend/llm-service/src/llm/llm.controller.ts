import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LlmService } from './llm.service';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('difficulty_generation')
  @HttpCode(HttpStatus.OK)
  async difficultyGeneration(
    @Body() body: DifficultyLlmGenerationDto,
  ): Promise<GeneratedTemplatesResponseDto> {
    return this.llmService.generateTemplates(body);
  }
}
