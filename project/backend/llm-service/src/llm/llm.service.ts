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
import {
  MistakeDetectedEvent,
  ReceivedReplyDto,
  ReplyEmailKind,
  ReplyReviewNeededEvent,
  SendReplyEmailEvent,
} from '@phishshield/dto';
import {
  ParsedReply,
  ReceivedEmailService,
} from './received-email/received-email.service';
import { ClassificationService } from './classification/classification.service';
import { MistakeCategory } from './dto/reply-classification.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ReplyGenerationService } from './reply-generation/reply-generation.service';

// Searches for <a href="{{tracking_link}}"></a>
const TRACKING_LINK_ANCHOR =
  /<a\s[^>]*href=["']\{\{tracking_link\}\}["'][^>]*>[\s\S]*?<\/a>/i;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly llmProvider: string;

  constructor(
    private readonly promptBuilderService: PromptBuilderService,
    private readonly llmGatewayService: LlmGatewayService,
    private readonly config: ConfigService,
    private readonly receivedEmailService: ReceivedEmailService,
    private readonly classificationService: ClassificationService,
    private readonly amqpConnection: AmqpConnection,
    private readonly replyGenerationService: ReplyGenerationService,
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

  async processReceivedReply(dto: ReceivedReplyDto): Promise<void> {
    this.logger.log(
      `Processing reply event ${dto.webhookEventId} (received email ${dto.emailId})`,
    );
    const reply = await this.receivedEmailService.fetchAndParse(dto);

    if (reply.isAutoReply) {
      this.logger.log(`Reply ${dto.emailId} is an auto-reply, skipping`);
      return;
    }

    if (!reply.replyText) {
      this.logger.log(`Reply ${dto.emailId} has no new text, skipping`);
      return;
    }

    const classification = await this.classificationService.classify({
      replyText: reply.replyText,
      originalSubject: reply.subject,
    });

    if (classification.needsReview || classification.categories.length === 0) {
      this.logger.log(
        `Reply ${dto.emailId} needs manual review, publishing review event`,
      );
      const reviewPayload: ReplyReviewNeededEvent = {
        emailId: dto.emailId,
        sender: this.extractAddress(reply.from),
        inReplyTo: reply.inReplyTo,
        references: reply.references,
        categories: classification.categories,
        severity: classification.severity,
        confidence: classification.confidence,
        occurredAt: new Date(),
      };
      try {
        await this.amqpConnection.publish(
          'llm-event-exchange',
          'reply.review',
          reviewPayload,
        );
      } catch (error) {
        this.logger.error(
          'Failed to publish review event',
          error instanceof Error ? error.stack : String(error),
        );
      }
      return;
    }

    if (!classification.categories.includes(MistakeCategory.VALID_RESPONSE)) {
      const mistakePayload: MistakeDetectedEvent = {
        emailId: dto.emailId,
        sender: this.extractAddress(reply.from),
        categories: classification.categories,
        severity: classification.severity,
        confidence: classification.confidence,
        occurredAt: new Date(),
      };
      const mailingPayload: SendReplyEmailEvent = {
        kind: ReplyEmailKind.FAILED_DEFAULT,
        emailId: dto.emailId,
        to: this.extractAddress(reply.from),
        from: dto.to[0],
        subject: this.buildFailedReplySubject(reply.subject),
        content: this.buildFailedReplyHtml(),
        inReplyTo: reply.messageId,
        references: [...reply.references, reply.messageId].filter(
          (id): id is string => !!id,
        ),
      };
      try {
        await this.amqpConnection.publish(
          'llm-event-exchange',
          'reply.mistake',
          mistakePayload,
        );

        await this.amqpConnection.publish(
          'llm-event-exchange',
          'reply.email',
          mailingPayload,
        );
      } catch (error) {
        this.logger.error(`Failed to publish event`, error);
      }
      return;
    }

    await this.handleValidReply(dto, reply);
  }

  private extractAddress(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return match ? match[1] : raw.trim();
  }

  private buildFailedReplySubject(originalSubject: string): string {
    return originalSubject.trim().toLowerCase().startsWith('re:')
      ? originalSubject
      : `Re: ${originalSubject}`;
  }

  private buildFailedReplyHtml(): string {
    return `
      <p>This was a simulated phishing email, sent as part of your organization's security awareness training.</p>
      <p>Your response has been recorded as a failed attempt to recognize a phishing email.</p>
      <p>If you believe this is a mistake, please contact your IT administrator.</p>
    `.trim();
  }

  private async handleValidReply(
    dto: ReceivedReplyDto,
    reply: ParsedReply,
  ): Promise<void> {
    const generated = await this.replyGenerationService.generateSafeReply({
      replyText: reply.replyText,
      quotedText: reply.quotedText,
      originalSubject: reply.subject,
    });

    if (!generated) {
      this.logger.warn(
        `Reply ${dto.emailId}: generation failed or was rejected, no reply sent`,
      );
      return;
    }

    const mailingPayload: SendReplyEmailEvent = {
      kind: ReplyEmailKind.GENERATED,
      emailId: dto.emailId,
      to: this.extractAddress(reply.from),
      from: dto.to[0],
      subject: generated.subject,
      content: generated.body,
      inReplyTo: reply.messageId,
      references: [...reply.references, reply.messageId].filter(
        (id): id is string => !!id,
      ),
    };

    try {
      await this.amqpConnection.publish(
        'llm-event-exchange',
        'reply.email',
        mailingPayload,
      );
    } catch (error) {
      this.logger.error(`Failed to publish generated reply event`, error);
    }
  }
}
