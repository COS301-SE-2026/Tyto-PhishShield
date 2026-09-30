import { Injectable, Logger } from '@nestjs/common';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { LlmGatewayService } from './llm-gateway/llm-gateway.service';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';
import { GeneratedTemplateDto } from './dto/generated-template.dto';
import { randomUUID } from 'node:crypto';
import { TEMPLATE_SCHEMA } from './prompt-builder/prompts/template-schema.prompts';
import { SPEAR_TEMPLATE_SCHEMA } from './prompt-builder/prompts/spear-template-schema.prompts';
import {
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from './dto/llm-gateway.dto';
import {
  MistakeDetectedEvent,
  ReceivedReplyDto,
  ReplyEmailKind,
  ReplyValidatedEvent,
  ReviewNeededEvent,
  ReviewType,
  SendReplyEmailEvent,
  SendSpearPhishingEvent,
  Severity,
} from '@phishshield/dto';
import {
  ParsedReply,
  ReceivedEmailService,
} from './received-email/received-email.service';
import { ClassificationService } from './classification/classification.service';
import { MistakeCategory } from './dto/reply-classification.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ReplyGenerationService } from './reply-generation/reply-generation.service';
import { GenerateSpearPhishingDto } from './dto/generate-spear-phishing.dto';
import { MailingEventService } from '../mailing-event/mailing-event.service';

const TRACKING_LINK_ANCHOR =
  /<a\s[^>]*href=["']\{\{tracking_link\}\}["'][^>]*>[\s\S]*?<\/a>/i;

// Anything that looks like a link: an anchor tag, a URL, or the tracking placeholder.
const NO_LINK_ALLOWED = /<a\s|https?:\/\/|www\.|tracking_link/i;

interface ClassificationResult {
  needsReview: boolean;
  categories: MistakeCategory[];
  severity: Severity;
  confidence: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly promptBuilderService: PromptBuilderService,
    private readonly llmGatewayService: LlmGatewayService,
    private readonly receivedEmailService: ReceivedEmailService,
    private readonly classificationService: ClassificationService,
    private readonly amqpConnection: AmqpConnection,
    private readonly replyGenerationService: ReplyGenerationService,
    private readonly mailingEventService: MailingEventService,
  ) {}

  async generateTemplates(
    dto: DifficultyLlmGenerationDto,
  ): Promise<GeneratedTemplatesResponseDto> {
    const prompt = this.promptBuilderService.buildSystemPrompt(dto);

    const requests = Array.from({ length: dto.count }, () =>
      this.llmGatewayService.sendWithFallback(this.buildGatewayRequest(prompt)),
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

  private buildGatewayRequest(
    systemPrompt: string,
    schema: object = TEMPLATE_SCHEMA,
  ): Omit<LlmGatewayRequestBody, 'model'> {
    const systemInstructions = `
      ${systemPrompt}
      
      You MUST respond with ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text.
      Ensure the JSON structure exactly matches this schema:
      ${JSON.stringify(schema)}
    `.trim();

    return {
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
    requireLink = true,
  ): GeneratedTemplateDto | null {
    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content) as { subject?: string; body?: string };
      if (!parsed.subject || !parsed.body) return null;

      if (requireLink && !TRACKING_LINK_ANCHOR.test(parsed.body)) return null;

      if (!requireLink && NO_LINK_ALLOWED.test(parsed.body)) return null;

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
    if (!reply.replyText && dto.attachments.length === 0) {
      this.logger.log(
        `Reply ${dto.emailId} has no new text or attachments, skipping`,
      );
      return;
    }

    const candidateIds = [reply.inReplyTo, ...reply.references].filter(
      (id): id is string => !!id,
    );

    const sentMessage =
      await this.mailingEventService.findSentMessage(candidateIds);

    if (!sentMessage) {
      this.logger.log(
        `Reply ${dto.emailId} doesn't reference a message we sent, ignoring`,
      );
      return;
    }

    const originalFromAddress = sentMessage.fromAddress ?? dto.to[0];

    const updatedData = { ...dto, to: [originalFromAddress] };

    if (!(await this.mailingEventService.isKnownSentMessage(candidateIds))) {
      this.logger.log(
        `Reply ${dto.emailId} doesn't reference a message we sent, ignoring`,
      );
      return;
    }

    const classification = await this.classificationService.classify({
      replyText: reply.replyText,
      originalSubject: reply.subject,
    });

    const hasAttachments = dto.attachments.length > 0;
    const llmFlagged =
      classification.needsReview || classification.categories.length === 0;

    if (hasAttachments || llmFlagged) {
      await this.publishReviewNeeded(updatedData, reply, classification, {
        hasAttachments,
        llmFlagged,
      });
      return;
    }

    if (!classification.categories.includes(MistakeCategory.VALID_RESPONSE)) {
      await this.publishMistakeDetected(updatedData, reply, classification);
      return;
    }

    await this.handleValidReply(updatedData, reply);
  }

  private async publishReviewNeeded(
    dto: ReceivedReplyDto,
    reply: ParsedReply,
    classification: ClassificationResult,
    flags: { hasAttachments: boolean; llmFlagged: boolean },
  ): Promise<void> {
    const reviewType =
      flags.hasAttachments && flags.llmFlagged
        ? ReviewType.BOTH
        : flags.hasAttachments
          ? ReviewType.ATTACHMENT
          : ReviewType.NEEDS_REVIEW;

    this.logger.log(
      `Reply ${dto.emailId} needs manual review (${reviewType}), publishing review event`,
    );

    const reviewPayload: ReviewNeededEvent = {
      reviewType,
      emailId: dto.emailId,
      messageId: reply.messageId,
      sender: this.extractAddress(reply.from),
      businessAddress: dto.to[0],
      subject: reply.subject,
      inReplyTo: reply.inReplyTo,
      references: reply.references,
      replyBody: reply.replyText,
      attachments: dto.attachments.length ? dto.attachments : undefined,
      categories: classification.categories,
      severity: classification.severity,
      confidence: classification.confidence,
      occurredAt: new Date(),
      quotedText: reply.quotedText,
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
  }

  private async publishMistakeDetected(
    dto: ReceivedReplyDto,
    reply: ParsedReply,
    classification: ClassificationResult,
  ): Promise<void> {
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
      originalSubject: reply.subject,
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
  }

  private extractAddress(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return match ? match[1] : raw.trim();
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

  async handleReplyValidated(event: ReplyValidatedEvent): Promise<void> {
    const generated = await this.replyGenerationService.generateSafeReply({
      replyText: event.replyText,
      quotedText: event.quotedText,
      originalSubject: event.subject,
    });

    if (!generated) {
      this.logger.warn(
        `Reply ${event.emailId}: generation failed or was rejected after review, no reply sent`,
      );
      return;
    }

    const mailingPayload: SendReplyEmailEvent = {
      kind: ReplyEmailKind.GENERATED,
      emailId: event.emailId,
      to: event.from,
      from: event.to,
      subject: generated.subject,
      content: generated.body,
      inReplyTo: event.messageId,
      references: [...event.references, event.messageId].filter(
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

  async processSpearPhishing(dto: GenerateSpearPhishingDto): Promise<void> {
    this.logger.log(
      `Starting spear-phishing generation for recipient ${dto.recipientAuth0Id}`,
    );

    const safeContext = await this.sanitizeContext(dto.extraContext);
    this.logger.warn(safeContext);
    if (dto.extraContext && !safeContext) {
      this.logger.log(
        `Proceeding with spear-phishing generation WITHOUT extra context for ${dto.recipientAuth0Id}`,
      );
    }

    const systemPrompt = this.promptBuilderService.buildSpearPhishingPrompt(
      dto,
      safeContext,
    );

    const requestBody = this.buildGatewayRequest(
      systemPrompt,
      SPEAR_TEMPLATE_SCHEMA,
    );
    let generatedTemplate: GeneratedTemplateDto | null = null;

    try {
      const response =
        await this.llmGatewayService.sendWithFallback(requestBody);
      generatedTemplate = this.parseTemplate(response, false);
    } catch (error) {
      this.logger.error(
        `Cloud LLM request failed for spear-phishing generation: ${error}`,
      );
      return;
    }

    if (!generatedTemplate) {
      this.logger.error(
        `Failed to parse generated spear-phishing template for recipient ${dto.recipientAuth0Id}. Validation failed.`,
      );
      return;
    }

    this.logger.log(
      `Spear-phishing template generated successfully. Subject: "${generatedTemplate.subject}"`,
    );

    const spearPhishingEvent: SendSpearPhishingEvent = {
      recipientAuth0Id: dto.recipientAuth0Id,
      senderAuth0Id: dto.senderAuth0Id,
      subject: generatedTemplate.subject,
      content: generatedTemplate.body,
      scheduledFrom: dto.scheduledFrom,
      scheduledTo: dto.scheduledTo,
    };

    try {
      await this.amqpConnection.publish(
        'llm-event-exchange',
        'spear-phishing.email',
        spearPhishingEvent,
      );
      this.logger.log(
        `Published spear-phishing event for recipient ${dto.recipientAuth0Id}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish spear-phishing event', error);
    }
  }

  private async sanitizeContext(context?: string): Promise<string | undefined> {
    if (!context || context.trim() === '') {
      return undefined;
    }
    try {
      const result = await this.classificationService.classify({
        replyText: context,
      });

      const clean =
        !result.needsReview &&
        result.categories.every((c) => c === MistakeCategory.VALID_RESPONSE);

      if (!clean) {
        this.logger.warn(
          `Spear-phishing context dropped, classifier flagged: ${result.categories.join(', ')}`,
        );
        return undefined;
      }

      return context.trim();
    } catch (err) {
      this.logger.warn(
        `Context classification failed, dropping context to be safe. Error: ${err}`,
      );
      return undefined;
    }
  }
}
