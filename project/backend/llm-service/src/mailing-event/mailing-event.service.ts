import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SentSimulationMessageEntity,
  SentMessageKind,
} from './entities/sent-simulation-message.entity';

interface BatchMailingEventEntry {
  auth0Id: string;
  emailId: string;
  from?: string;
}

@Injectable()
export class MailingEventService {
  private readonly logger = new Logger(MailingEventService.name);

  constructor(
    @InjectRepository(SentSimulationMessageEntity)
    private readonly sentMessageRepository: Repository<SentSimulationMessageEntity>,
  ) {}

  async recordSingle(
    routingKey: string,
    emailId: string | undefined,
    recipientAuth0Id: string | undefined,
    fromAddress: string | undefined,
  ): Promise<void> {
    this.logger.warn(emailId, recipientAuth0Id);
    if (!emailId || !recipientAuth0Id) {
      this.logger.warn(
        `Mailing event on ${routingKey} missing emailId or auth0Id, skipping`,
      );
      return;
    }
    await this.record(
      emailId,
      recipientAuth0Id,
      this.kindForRoutingKey(routingKey),
      fromAddress,
    );
  }

  async recordBatch(
    routingKey: string,
    entries: BatchMailingEventEntry[],
  ): Promise<void> {
    const kind = this.kindForRoutingKey(routingKey);
    for (const entry of entries) {
      if (entry.emailId) {
        await this.record(entry.emailId, entry.auth0Id, kind, entry.from);
      }
    }
  }

  async backfillMessageId(emailId: string, messageId: string): Promise<void> {
    try {
      await this.sentMessageRepository.update(
        { emailId },
        { messageId: this.stripBrackets(messageId) },
      );
    } catch (err) {
      this.logger.warn(`Failed to backfill messageId for ${emailId}: ${err}`);
    }
  }

  private stripBrackets(value: string): string {
    return value.trim().replace(/^<|>$/g, '');
  }

  async isKnownSentMessage(candidateIds: string[]): Promise<boolean> {
    if (candidateIds.length === 0) return false;
    const match = await this.sentMessageRepository.findOne({
      where: candidateIds.map((messageId) => ({ messageId })),
    });
    return !!match;
  }

  private async record(
    emailId: string,
    recipientAuth0Id: string,
    kind: SentMessageKind,
    fromAddress?: string,
  ): Promise<void> {
    try {
      await this.sentMessageRepository.save({
        emailId,
        recipientAuth0Id,
        kind,
        fromAddress,
      });
    } catch (err) {
      this.logger.warn(`Failed to record sent message ${emailId}: ${err}`);
    }
  }

  private kindForRoutingKey(routingKey: string): SentMessageKind {
    if (routingKey === 'mailing.spear_phishing')
      return SentMessageKind.SPEAR_PHISHING;
    if (routingKey === 'mailing.reply') return SentMessageKind.GENERATED_REPLY;
    return SentMessageKind.TEMPLATE;
  }

  async findSentMessage(
    candidateIds: string[],
  ): Promise<SentSimulationMessageEntity | null> {
    if (candidateIds.length === 0) return null;
    return this.sentMessageRepository.findOne({
      where: candidateIds.map((messageId) => ({ messageId })),
    });
  }
}
