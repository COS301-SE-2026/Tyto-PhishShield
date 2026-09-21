import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LlmService } from './llm.service';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';
import { ClassifyReplyDto } from './dto/classify-reply.dto';
import { ReplyClassificationDto } from './dto/reply-classification.dto';
import { ClassificationService } from './classification/classification.service';

@Controller('llm')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly classificationService: ClassificationService,
  ) {}

  @Post('difficulty_generation')
  @HttpCode(HttpStatus.OK)
  async difficultyGeneration(
    @Body() body: DifficultyLlmGenerationDto,
  ): Promise<GeneratedTemplatesResponseDto> {
    return this.llmService.generateTemplates(body);
  }

  @Post('classify_reply')
  @HttpCode(HttpStatus.OK)
  async classifyReply(
    @Body() body: ClassifyReplyDto,
  ): Promise<ReplyClassificationDto> {
    return this.classificationService.classify(body);
  }
}
