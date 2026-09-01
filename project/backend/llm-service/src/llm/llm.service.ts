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

// Searches for <a href="{{tracking_link}}"></a>
const TRACKING_LINK_ANCHOR =
  /<a\s+href=["']\{\{tracking_link\}\}["']>.*?<\/a>/i;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly promptBuilderService: PromptBuilderService,
    private readonly llmGatewayService: LlmGatewayService,
  ) {}

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
    return {
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral', ttl: '5m' },
            },
          ],
        },
        { role: 'user', content: 'Generate one template variant.' },
      ],
      temperature: 0.9,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'phishing_template',
          strict: true,
          schema: TEMPLATE_SCHEMA as unknown as Record<string, null>,
        },
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
