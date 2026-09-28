import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmGatewayService } from '../llm-gateway/llm-gateway.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import {
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';
import {
  RawRedactionItem,
  RedactionItem,
  RedactionItemType,
  RedactionResult,
} from '../dto/redacted.dto';

// We are redacting with [...] where the redaction type will be inside the brackets.
const REDACTION_TOKEN = /\[[A-Z_]+_\d+\]/;

// There can be multiple names mentioned, and they are kept apart to provide more context to the cloud llm.
const NAME_TOKEN = /\[NAME_\d+\]/g;

// Just incase local llm missed certain values, we do our own checks.
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

export interface GeneratedReply {
  subject: string;
  body: string;
}

@Injectable()
export class ReplyGenerationService {
  private readonly logger = new Logger(ReplyGenerationService.name);
  private readonly localModel: string;
  private readonly cloudModel: string;

  constructor(
    private readonly llmGatewayService: LlmGatewayService,
    private readonly config: ConfigService,
    private readonly promptBuilderService: PromptBuilderService,
  ) {
    this.localModel = this.config.get<string>('LOCAL_LLM_MODEL', 'gemma2:2b');
    this.cloudModel = this.config.get<string>(
      'LLM_PROVIDER',
      'google-ai-studio/gemini-3.1-flash-lite',
    );
  }

  async generateSafeReply(params: {
    replyText: string;
    quotedText: string;
    originalSubject: string;
  }): Promise<GeneratedReply | null> {
    const [redactedReply, redactedQuoted] = await Promise.all([
      this.redact(params.replyText),
      this.redact(params.quotedText),
    ]);

    this.logger.log(
      `Redacted ${redactedReply.items.length} item(s) from reply, ` +
        `${redactedQuoted.items.length} from quoted text`,
    );

    return this.generate({
      redactedReplyText: redactedReply.redactedText,
      originalSubject: params.originalSubject,
      redactedQuotedText: redactedQuoted.redactedText,
    });
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
      const raw = await this.llmGatewayService.sendLocal({
        model: this.localModel,
        messages: [
          {
            role: 'system',
            content: this.promptBuilderService.buildRedactionPrompt(),
          },
          { role: 'user', content: text },
        ],
        format: 'json',
      });

      const parsed = JSON.parse(raw) as { items?: RawRedactionItem[] };
      if (!Array.isArray(parsed.items)) return [];

      return parsed.items
        .filter(
          (i): i is { text: string; type: string } =>
            typeof i.text === 'string' && typeof i.type === 'string',
        )
        .map((i) => ({
          text: i.text,
          type: Object.values(RedactionItemType).includes(
            i.type as RedactionItemType,
          )
            ? (i.type as RedactionItemType)
            : RedactionItemType.OTHER,
        }));
    } catch (err) {
      this.logger.warn(`Local LLM redaction detection failed: ${err}`);
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
      response = await this.llmGatewayService.send({
        model: this.cloudModel,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userContent },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      } satisfies LlmGatewayRequestBody);
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
