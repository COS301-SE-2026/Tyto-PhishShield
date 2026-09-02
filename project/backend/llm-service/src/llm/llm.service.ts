import { Injectable, Logger } from '@nestjs/common';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { LlmGatewayService } from './llm-gateway/llm-gateway.service';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';
import { GeneratedTemplateDto } from './dto/generated-template.dto';
import { randomUUID } from 'node:crypto';
import { TEMPLATE_SCHEMA } from './prompt-builder/prompts/template-schema.prompts';
import {
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from './dto/llm-gateway.dto';
import { ConfigService } from '@nestjs/config';

// Searches for <a href="{{tracking_link}}"></a>
const TRACKING_LINK_ANCHOR =
  /<a\s+href=["']\{\{tracking_link\}\}["']>.*?<\/a>/i;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly llmProvider: string;

  constructor(
    private readonly promptBuilderService: PromptBuilderService,
    private readonly llmGatewayService: LlmGatewayService,
    private readonly config: ConfigService,
  ) {
    this.llmProvider = this.config.get<string>(
      'LLM_PROVIDER',
      'google-ai-studio/gemini-3.1-flash-lite',
    );
  }

  async generateTemplates(
    dto: DifficultyLlmGenerationDto,
  ): Promise<GeneratedTemplatesResponseDto> {
    const prompt = this.promptBuilderService.buildSystemPrompt(dto);

    const requests = Array.from({ length: dto.count }, () =>
      this.llmGatewayService.send(this.buildGatewayRequest(prompt)),
    );

    const responses = await Promise.allSettled(requests);
    const templates: GeneratedTemplateDto[] = [];
    let failedCount = 0;

    for (const response of responses) {
      if (response.status === 'fulfilled') {
        const parsed = this.parseTemplate(response.value);
        if (parsed) {
          templates.push(parsed);
          continue;
        }
        this.logger.warn('Generated template failed validation');
      } else {
        this.logger.warn(`LLM gateway request rejected: ${response.reason}`);
      }
      failedCount++;
    }

    if (templates.length === 0) {
      throw new Error('No templates generated');
    }

    return {
      requested: dto.count,
      generated: templates.length,
      failed: failedCount,
      templates,
    };
  }

  private buildGatewayRequest(systemPrompt: string): LlmGatewayRequestBody {
    const systemInstructions = `
      ${systemPrompt}
      
      You MUST respond with ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text.
      Ensure the JSON structure exactly matches this schema:
      ${JSON.stringify(TEMPLATE_SCHEMA)}
    `.trim();

    return {
      model: this.llmProvider,
      messages: [
        {
          role: 'system',
          content: systemInstructions,
        },
        {
          role: 'user',
          content: 'Generate one template variant as a raw JSON object.',
        },
      ],
      temperature: 0.7,
      response_format: {
        type: 'json_object',
      },
    };
  }

  private parseTemplate(
    response: OkLlmGatewayResponse,
  ): GeneratedTemplateDto | null {
    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content) as { subject?: string; body?: string };
      if (!parsed.subject || !parsed.body) return null;

      // Checks if the html link was added.
      if (!TRACKING_LINK_ANCHOR.test(parsed.body)) return null;

      return { id: randomUUID(), subject: parsed.subject, body: parsed.body };
    } catch {
      return null;
    }
  }
}
