import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm-gateway/llm-gateway.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import {
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';
import {
  RedactionItem,
  RedactionItemType,
  RedactionResult,
} from '../dto/redacted.dto';
import { detectSensitiveWords } from '../filter/filter.service';
import { ClassificationService } from '../classification/classification.service';
import { ReplyClassificationDto } from '../dto/reply-classification.dto';

// We are redacting with [...] where the redaction type will be inside the brackets.
const REDACTION_TOKEN = /\[[A-Z_]+_\d+\]/;

// There can be multiple names mentioned, and they are kept apart to provide more context to the cloud llm.
const NAME_TOKEN = /\[NAME_\d+\]/g;

// Keep deterministic checks for values the entity detector may miss.
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

const ENTITY_TAG_TO_REDACTION_TYPE: Record<string, RedactionItemType> = {
  '<NAME>': RedactionItemType.NAME,
  '<BUSINESS_NAME>': RedactionItemType.BUSINESS_NAME,
  '<EMAIL>': RedactionItemType.EMAIL,
  '<PHONE>': RedactionItemType.PHONE,
  '<ADDRESS>': RedactionItemType.ADDRESS,
  '<ID_NUMBER>': RedactionItemType.ID_NUMBER,
  '<OTHER>': RedactionItemType.OTHER,
};

export interface GeneratedReply {
  subject: string;
  body: string;
}

export interface RedactedReplyContext {
  redactedReplyText: string;
  redactedQuotedText: string;
  originalSubject: string;
}

export interface ReplyAnalysis extends RedactedReplyContext {
  classification: ReplyClassificationDto;
}

@Injectable()
export class ReplyGenerationService {
  private readonly logger = new Logger(ReplyGenerationService.name);

  constructor(
    private readonly llmGatewayService: LlmGatewayService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly classificationService: ClassificationService,
  ) {}

  async generateSafeReply(params: {
    replyText: string;
    quotedText: string;
    originalSubject: string;
  }): Promise<GeneratedReply | null> {
    const analysis = await this.analyzeReply(params);
    if (analysis.classification.needsReview) {
      this.logger.warn(
        `Reply generation blocked because cloud confidence was below the configured threshold`,
      );
      return null;
    }

    return this.generateRedactedReply(analysis);
  }

  async analyzeReply(params: {
    replyText: string;
    quotedText: string;
    originalSubject: string;
  }): Promise<ReplyAnalysis> {
    const redactedContext = await this.sanitizeReplyContext(params);
    const classification = await this.classificationService.classifyRedacted({
      replyText: redactedContext.redactedReplyText,
      originalSubject: redactedContext.originalSubject,
    });

    return {
      ...redactedContext,
      classification,
    };
  }

  async sanitizeReplyContext(params: {
    replyText: string;
    quotedText: string;
    originalSubject: string;
  }): Promise<RedactedReplyContext> {
    const [redactedReply, redactedQuoted] = await Promise.all([
      this.redact(params.replyText),
      this.redact(params.quotedText),
    ]);
    const redactedSubject = await this.redact(params.originalSubject);

    this.logger.log(
      `Redacted ${redactedReply.items.length} item(s) from reply, ` +
        `${redactedQuoted.items.length} from quoted text`,
    );

    return {
      redactedReplyText: redactedReply.redactedText,
      originalSubject: redactedSubject.redactedText,
      redactedQuotedText: redactedQuoted.redactedText,
    };
  }

  async generateRedactedReply(
    params: RedactedReplyContext,
  ): Promise<GeneratedReply | null> {
    return this.generate(params);
  }

  private async redact(text: string): Promise<RedactionResult> {
    if (!text.trim()) return { redactedText: text, items: [] };

    const detected = await this.detectSensitiveItems(text);
    const withRegex = this.addRegexMatches(text, detected);

    // We first replace longer words before shorter ones, for instance: "Name  Surname" before just "Name" (Assume Name and Surname are actual naames and surnames).
    const verified = withRegex
      .filter((item) => text.includes(item.text))
      .sort((a, b) => b.text.length - a.text.length);

    let redactedText = text;
    const items: RedactionItem[] = [];
    const counters: Partial<Record<RedactionItemType, number>> = {};

    for (const item of verified) {
      // When a longer text was already redacted.
      if (!redactedText.includes(item.text)) continue;

      const n = (counters[item.type] ?? 0) + 1;
      counters[item.type] = n;
      const token = `[${item.type.toUpperCase()}_${n}]`;

      redactedText = redactedText.split(item.text).join(token);
      items.push(item);
    }

    return { redactedText, items };
  }

  private async detectSensitiveItems(text: string): Promise<RedactionItem[]> {
    try {
      const detected = await detectSensitiveWords(text);

      return detected.map(({ word, tag }) => ({
        text: word,
        type: ENTITY_TAG_TO_REDACTION_TYPE[tag] ?? RedactionItemType.OTHER,
      }));
    } catch (err) {
      this.logger.warn(`GLiNER redaction detection failed: ${err}`);
      // We fall to the Regex.
      return [];
    }
  }

  private addRegexMatches(
    text: string,
    detected: RedactionItem[],
  ): RedactionItem[] {
    const items = [...detected];
    const alreadyFound = new Set(detected.map((i) => i.text));

    for (const match of text.match(EMAIL_RE) ?? []) {
      if (!alreadyFound.has(match)) {
        items.push({ text: match, type: RedactionItemType.EMAIL });
        alreadyFound.add(match);
      }
    }
    for (const match of text.match(PHONE_RE) ?? []) {
      if (!alreadyFound.has(match)) {
        items.push({ text: match, type: RedactionItemType.PHONE });
        alreadyFound.add(match);
      }
    }
    return items;
  }

  private async generate(params: {
    redactedReplyText: string;
    originalSubject: string;
    redactedQuotedText: string;
  }): Promise<GeneratedReply | null> {
    const systemInstructions =
      this.promptBuilderService.buildReplyGenerationPrompt();
    const userContent = this.buildUserContent(params);

    let response: OkLlmGatewayResponse;
    try {
      response = await this.llmGatewayService.sendWithFallback({
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userContent },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      } satisfies Omit<LlmGatewayRequestBody, 'model'>);
    } catch (err) {
      this.logger.warn(`Cloud LLM reply generation request failed: ${err}`);
      return null;
    }

    return this.parseAndValidate(response);
  }

  private buildUserContent(params: {
    redactedReplyText: string;
    originalSubject: string;
    redactedQuotedText: string;
  }): string {
    const parts = [
      `Subject so far: "${params.originalSubject}"`,
      `The recipient just replied with:\n"""${params.redactedReplyText}"""`,
    ];
    if (params.redactedQuotedText.trim()) {
      parts.push(
        `Earlier context quoted in their reply (may be partial/unreliable):\n"""${params.redactedQuotedText}"""`,
      );
    }
    parts.push('Write your short follow-up reply as a raw JSON object.');
    return parts.join('\n\n');
  }

  private parseAndValidate(
    response: OkLlmGatewayResponse,
  ): GeneratedReply | null {
    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    let parsed: { subject?: string; body?: string };
    try {
      parsed = JSON.parse(content) as { subject?: string; body?: string };
    } catch {
      this.logger.warn('Cloud LLM returned non-JSON reply output');
      return null;
    }
    if (!parsed.subject || !parsed.body) return null;

    // This was a small error picked up. It might be removed in future.
    const body = parsed.body.replace(NAME_TOKEN, '{{name}}');
    const subject = parsed.subject.replace(NAME_TOKEN, '{{name}}');

    if (REDACTION_TOKEN.test(body) || REDACTION_TOKEN.test(subject)) {
      this.logger.error(
        'Generated reply still contains a redaction token after mapping, discarding to avoid a leak',
      );
      return null;
    }

    return { subject, body };
  }
}
