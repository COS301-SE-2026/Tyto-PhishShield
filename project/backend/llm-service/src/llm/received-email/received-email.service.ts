/**
 * llm-service
 *
 * received-email.service.ts
 *
 * Purpose:
 * This file's job is to provide functionality to process the received email content from Resend into a more usable format.
 * It mainly checks headers for auto replies and extracts the body of both the original message and the reply received.
 *
 * Note:
 * Most of the functions here where heavily inspired by functions in the provided example repository form Resend.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ReceivedReplyDto } from '@phishshield/dto';

export interface ParsedReply {
  emailId: string;
  from: string;
  subject: string;
  replyText: string;
  quotedText: string;
  messageId?: string;
  inReplyTo?: string;
  references: string[];
  isAutoReply: boolean;
}

// Commonly used named entities.
// Recommended by Resend.
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
};

// These are the lines we are focusing on.
const WROTE_LINE = /^On\s.+\swrote:\s*$/i;
const ORIGINAL_MESSAGE = /^-{2,}\s*Original Message\s*-{2,}$/i;
const HEADER_FROM = /^From:\s/i;
const HEADER_SENT = /^(Sent|Date):\s/i;
const UNDERSCORE_DIVIDER = /^_{5,}$/;

@Injectable()
export class ReceivedEmailService {
  private readonly resend: Resend;
  private readonly resendApiKey: string;
  private readonly logger = new Logger(ReceivedEmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resendApiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(this.resendApiKey);
  }

  async fetchAndParse(dto: ReceivedReplyDto): Promise<ParsedReply> {
    const { data: email, error } = await this.resend.emails.receiving.get(
      dto.emailId,
    );
    if (error || !email) {
      throw new Error(
        `Could not fetch received email ${dto.emailId}: ${error?.message ?? 'no data'}`,
      );
    }

    this.logger.debug(`Fetched received email ${dto.emailId}`);

    const headers: unknown = email.headers;
    const body = email.text?.trim() ? email.text : this.htmlToText(email.html);
    const { replyText, quotedText } = this.splitQuoted(body);

    return {
      emailId: dto.emailId,
      from: dto.from,
      subject: dto.subject,
      replyText,
      quotedText,
      messageId: this.stripBrackets(this.header(headers, 'message-id')),
      inReplyTo: this.stripBrackets(this.header(headers, 'in-reply-to')),
      references: (this.header(headers, 'references') ?? '')
        .split(/\s+/)
        .map((r) => this.stripBrackets(r))
        .filter((r): r is string => !!r),
      isAutoReply: this.isAutoReply(headers, dto.subject),
    };
  }

  private header(headers: unknown, name: string): string | undefined {
    if (!headers) return undefined;
    if (Array.isArray(headers)) {
      const hit = headers.find(
        (h: { name?: string }) => h?.name?.toLowerCase() === name,
      ) as { value?: string } | undefined;
      return hit?.value;
    }
    if (typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === name) return String(value);
      }
    }
    return undefined;
  }

  // Remove "<" or ">" brackets.
  private stripBrackets(value?: string): string | undefined {
    return value?.trim().replace(/^<|>$/g, '') || undefined;
  }

  private isAutoReply(headers: unknown, subject?: string): boolean {
    // RFC 3834: any Auto-Submitted value other than "no" means automatic.
    const autoSubmitted = this.header(headers, 'auto-submitted');
    if (autoSubmitted && autoSubmitted.trim().toLowerCase() !== 'no') {
      this.logger.debug(
        `isAutoReply: matched Auto-Submitted header "${autoSubmitted}"`,
      );
      return true;
    }

    const precedence = this.header(headers, 'precedence')?.trim().toLowerCase();
    if (precedence && ['bulk', 'junk', 'auto_reply'].includes(precedence)) {
      this.logger.debug(
        `isAutoReply: matched Precedence header "${precedence}"`,
      );
      return true;
    }

    if (
      this.header(headers, 'x-autoreply') ||
      this.header(headers, 'x-autorespond')
    ) {
      this.logger.debug(
        'isAutoReply: matched X-Autoreply/X-Autorespond header',
      );
      return true;
    }

    // Fallback for clients that don't set headers. English only.
    const subjectMatch =
      /^(automatic reply|auto(matic)?[- ]?reply|out of office)/i.test(
        (subject ?? '').trim(),
      );
    if (subjectMatch) {
      this.logger.debug('isAutoReply: matched subject pattern');
    }
    return subjectMatch;
  }

  // Common html regex that we replace with normal text elements such as new lines.
  // This is to help the local llm work more efficiently and to not provide incorrect responses.
  private htmlToText(html?: string | null): string {
    if (!html) return '';
    const stripped = html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>|<\/(p|div|tr|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return this.decodeEntities(stripped)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  //Single-pass entity decoding as recommended by Resend.
  private decodeEntities(text: string): string {
    return text.replace(
      /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi,
      (match, entity: string) => {
        if (entity.toLowerCase() === 'amp') return '&';
        if (entity[0] === '#') {
          const isHex = entity[1]?.toLowerCase() === 'x';
          const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
          try {
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
          } catch {
            return match;
          }
        }
        return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
      },
    );
  }

  // Split the message body into the parts we are focussing on.
  private splitQuoted(text: string): { replyText: string; quotedText: string } {
    const lines = text.replace(/\r\n/g, '\n').split('\n');

    const isQuoteLine = (line?: string) =>
      !!line && line.trim().startsWith('>');

    const nextNonEmpty = (from: number): string | undefined =>
      lines.slice(from).find((l) => l.trim() !== '');

    const cut = lines.findIndex((line, i) => {
      const trimmed = line.trim();
      const joined = `${trimmed} ${lines[i + 1]?.trim() ?? ''}`;

      if (WROTE_LINE.test(trimmed) || WROTE_LINE.test(joined)) return true;

      if (ORIGINAL_MESSAGE.test(trimmed)) return true;

      if (UNDERSCORE_DIVIDER.test(trimmed)) {
        return HEADER_FROM.test(nextNonEmpty(i + 1)?.trim() ?? '');
      }

      if (
        HEADER_FROM.test(trimmed) &&
        lines.slice(i + 1, i + 4).some((l) => HEADER_SENT.test(l.trim()))
      ) {
        return true;
      }

      if (isQuoteLine(line)) {
        return isQuoteLine(nextNonEmpty(i + 1));
      }

      return false;
    });

    if (cut === -1) return { replyText: text.trim(), quotedText: '' };
    return {
      replyText: lines.slice(0, cut).join('\n').trim(),
      quotedText: lines.slice(cut).join('\n').trim(),
    };
  }
}
