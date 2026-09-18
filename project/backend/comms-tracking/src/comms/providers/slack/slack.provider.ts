import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from '@slack/bolt';
import { CommsService } from '../../comms.service';
import { SlackUserMapper } from './slack-user-mapper';
import { CommsSource } from '../../entities/communication.entity';

@Injectable()
export class SlackProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlackProvider.name);
  private app!: App;

  constructor(
    private readonly config: ConfigService,
    private readonly commsService: CommsService,
    private readonly userMapper: SlackUserMapper,
  ) {}

  async onModuleInit(): Promise<void> {
    const botToken = this.config.get<string>('SLACK_BOT_TOKEN');
    const appToken = this.config.get<string>('SLACK_APP_TOKEN');

    if (!botToken || !appToken) {
      this.logger.warn(
        'SLACK_BOT_TOKEN or SLACK_APP_TOKEN missing — Slack provider disabled',
      );
      return;
    }

    this.app = new App({
      token: botToken,
      appToken,
      socketMode: true,
      signingSecret: this.config.get<string>('SLACK_SIGNING_SECRET'),
    });

    // Fires for `message.channels` and `message.im`.
    this.app.event('message', async ({ event, client }) => {
      try {
        await this.handleMessage(event, client);
      } catch (err) {
        this.logger.error('Error handling Slack message', err);
      }
    });

    this.app.error(async (err) => this.logger.error('Slack error', err));

    await this.app.start();
    this.logger.log('Slack provider started (Socket Mode)');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.app) await this.app.stop();
  }

  private async handleMessage(event: any, client: any): Promise<void> {
    // Ignore bots, edits, joins, and other subtypes — only real user messages.
    if (!event.user) return;
    if (event.subtype) return;
    if (event.bot_id) return;

    const text: string = event.text ?? '';
    const mentionedSlackIds = this.extractMentions(text);

    const senderAuth0Id = await this.userMapper.toAuth0Id(event.user, client);
    if (!senderAuth0Id) return;

    const receiverAuth0Ids: string[] = [];
    for (const slackId of mentionedSlackIds) {
      if (slackId === event.user) continue;
      const id = await this.userMapper.toAuth0Id(slackId, client);
      if (id) receiverAuth0Ids.push(id);
    }

    // Reply detection: thread_ts set and different from this message's ts.
    const isReply = !!event.thread_ts && event.thread_ts !== event.ts;
    if (isReply) {
      const parentSlackId = await this.userMapper.getThreadParentAuthor(
        event.channel,
        event.thread_ts,
        client,
      );
      if (parentSlackId && parentSlackId !== event.user) {
        const parentAuth0Id = await this.userMapper.toAuth0Id(
          parentSlackId,
          client,
        );
        if (parentAuth0Id && !receiverAuth0Ids.includes(parentAuth0Id)) {
          receiverAuth0Ids.push(parentAuth0Id);
        }
      }
    }

    // Nothing to record if no one was addressed.
    if (receiverAuth0Ids.length === 0) return;

    await this.commsService.recordCommunication({
      source: CommsSource.SLACK,
      externalMessageId: event.ts,
      senderAuth0Id,
      receiverAuth0Ids,
      channelExternalId: event.channel,
      isReply,
      parentExternalId: event.thread_ts,
      occurredAt: new Date(Number(event.ts.split('.')[0]) * 1000),
    });
  }

  private extractMentions(text: string): string[] {
    // Matches <@U123> and <@U123|name>
    const matches = text.match(/<@([A-Z0-9]+)(?:\|[^>]+)?>/g) ?? [];
    return matches.map((m) => m.replace(/<@|\|[^>]+>|>/g, ''));
  }
}
