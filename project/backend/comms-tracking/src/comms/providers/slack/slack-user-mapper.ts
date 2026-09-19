import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebClient } from '@slack/web-api';
import { CommsUser } from '../../entities/comms-user.entity';

@Injectable()
export class SlackUserMapper {
  private readonly logger = new Logger(SlackUserMapper.name);
  // Simple in-memory cache to avoid hitting Slack on every message.
  private readonly slackToAuth0 = new Map<string, string>();

  constructor(
    @InjectRepository(CommsUser)
    private readonly userRepo: Repository<CommsUser>,
  ) {}

  async toAuth0Id(slackId: string, client: WebClient): Promise<string | null> {
    // 1. In-memory
    const cached = this.slackToAuth0.get(slackId);
    if (cached) return cached;

    // 2. Persistent (already mapped before)
    const existing = await this.userRepo.findOne({ where: { slackId } });
    if (existing) {
      this.slackToAuth0.set(slackId, existing.auth0Id);
      return existing.auth0Id;
    }

    // 3. Ask Slack for the email, then look it up locally
    try {
      const info = await client.users.info({ user: slackId });
      const email = info.user?.profile?.email;
      if (!email) {
        this.logger.warn(`Slack user ${slackId} has no email in profile`);
        return null;
      }

      const byEmail = await this.userRepo.findOne({ where: { email } });
      if (!byEmail) {
        this.logger.warn(
          `No local user with email ${email} (Slack ${slackId})`,
        );
        return null;
      }

      byEmail.slackId = slackId;
      await this.userRepo.save(byEmail);
      this.slackToAuth0.set(slackId, byEmail.auth0Id);
      return byEmail.auth0Id;
    } catch (err) {
      this.logger.error(`Failed to resolve Slack user ${slackId}`, err);
      return null;
    }
  }

  async getThreadParentAuthor(
    channel: string,
    threadTs: string,
    client: WebClient,
  ): Promise<string | null> {
    try {
      const res = await client.conversations.replies({
        channel,
        ts: threadTs,
        limit: 1,
      });
      return res.messages?.[0]?.user ?? null;
    } catch (err) {
      this.logger.warn(`Failed to fetch parent for thread ${threadTs}`, err);
      return null;
    }
  }
}
