import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm-gateway/llm-gateway.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { ConfigService } from '@nestjs/config';
import { ClassifyReplyDto } from '../dto/classify-reply.dto';
import {
  MISTAKE_SEVERITY,
  MistakeCategory,
  ReplyClassificationDto,
  Severity,
  SEVERITY_ORDER,
} from '../dto/reply-classification.dto';

interface RawClassificationOutput {
  categories?: unknown;
  confidence?: unknown;
}

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private readonly localModel: string;
  private readonly minConfidence: number;

  constructor(
    private readonly llmGatewayService: LlmGatewayService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly config: ConfigService,
  ) {
    this.localModel = this.config.get<string>('LOCAL_LLM_MODEL', 'gemma2:2b');
    this.minConfidence = this.config.get<number>(
      'CLASSIFICATION_MIN_CONFIDENCE',
      0.6,
    );
  }

  async classify(dto: ClassifyReplyDto): Promise<ReplyClassificationDto> {
    const systemInstructions =
      this.promptBuilderService.buildClassificationPrompt();

    const userContent = dto.originalSubject
      ? `Original email subject: "${dto.originalSubject}"\nReply to classify:\n"""${dto.replyText}"""`
      : `Reply to classify:\n"""${dto.replyText}"""`;

    let raw: string;
    try {
      raw = await this.llmGatewayService.sendLocal({
        model: this.localModel,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userContent },
        ],
        format: 'json',
      });
    } catch (err) {
      this.logger.warn(`Local LLM classification request failed: ${err}`);
      return this.fallback();
    }

    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): ReplyClassificationDto {
    let parsed: RawClassificationOutput;
    try {
      parsed = JSON.parse(raw) as RawClassificationOutput;
    } catch {
      this.logger.warn(
        `Local LLM returned non-JSON classification output: ${raw}`,
      );
      return this.fallback();
    }

    if (!Array.isArray(parsed.categories)) {
      this.logger.warn(
        `Expected "categories" to be an array but got: ${JSON.stringify(
          parsed.categories,
        )}. If this is undefined, the model likely used a different key name than "categories".`,
      );
    }

    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((cat): cat is MistakeCategory =>
          Object.values(MistakeCategory).includes(cat as MistakeCategory),
        )
      : [];

    if (
      Array.isArray(parsed.categories) &&
      parsed.categories.length > 0 &&
      categories.length === 0
    ) {
      this.logger.warn(
        `Model returned categories that don't match the MistakeCategory enum values: ${JSON.stringify(
          parsed.categories,
        )}.`,
      );
    }

    const confidence =
      typeof parsed.confidence === 'number' &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 1
        ? parsed.confidence
        : 0;

    if (typeof parsed.confidence !== 'number') {
      this.logger.warn(
        `Expected "confidence" to be a number but got: ${JSON.stringify(
          parsed.confidence,
        )}.`,
      );
    }

    if (categories.length === 0 || confidence < this.minConfidence) {
      this.logger.warn(
        `Classification below confidence threshold or produced no valid categories (confidence=${confidence})`,
      );
      return this.fallback();
    }

    return {
      categories,
      severity: this.maxSeverity(categories),
      confidence,
      needsReview: false,
    };
  }

  private maxSeverity(categories: MistakeCategory[]): Severity {
    return categories.reduce<Severity>((max, category) => {
      const severity = MISTAKE_SEVERITY[category];
      return SEVERITY_ORDER.indexOf(severity) > SEVERITY_ORDER.indexOf(max)
        ? severity
        : max;
    }, Severity.NONE);
  }

  private fallback(): ReplyClassificationDto {
    return {
      categories: [MistakeCategory.NEEDS_REVIEW],
      severity: Severity.NONE,
      confidence: 0,
      needsReview: true,
    };
  }
}
