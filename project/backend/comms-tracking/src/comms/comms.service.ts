import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, DataSource, Not, IsNull } from 'typeorm';
import { Communication, CommsSource } from './entities/communication.entity';
import { Connection } from './entities/connection.entity';
import { CommsUser } from './entities/comms-user.entity';
import { NormalizedMessage } from './providers/comms-provider.interface';
import { EventProducerService } from '../events/event-producer.service';

export interface MessageRecord {
  id: string;
  source: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  text: string | null;
  isReply: boolean;
  channelExternalId: string | null;
  occurredAt: string;
}

@Injectable()
export class CommsService {
  private readonly logger = new Logger(CommsService.name);
  private static readonly STRONG_CONNECTION_THRESHOLDS = [
    2, 5, 10, 25, 50, 100,
  ];
  constructor(
    @InjectRepository(Communication)
    private readonly commRepo: Repository<Communication>,
    @InjectRepository(Connection)
    private readonly connRepo: Repository<Connection>,
    @InjectRepository(CommsUser)
    private readonly userRepo: Repository<CommsUser>,
    private readonly eventProducer: EventProducerService,
    private readonly dataSource: DataSource,
  ) {}

  async recordCommunication(msg: NormalizedMessage): Promise<void> {
    // 1. Idempotency on external message id
    const existing = await this.commRepo.findOne({
      where: {
        source: msg.source,
        externalMessageId: msg.externalMessageId,
      },
    });
    if (existing) {
      this.logger.debug(
        `Skipping duplicate ${msg.source} message ${msg.externalMessageId}`,
      );
      return;
    }

    // 2. Persist the raw communication
    await this.commRepo.save(
      this.commRepo.create({
        source: msg.source,
        externalMessageId: msg.externalMessageId,
        senderAuth0Id: msg.senderAuth0Id,
        receiverAuth0Ids: msg.receiverAuth0Ids,
        channelExternalId: msg.channelExternalId,
        isReply: msg.isReply,
        parentExternalId: msg.parentExternalId,
        text: msg.text ?? null,
        occurredAt: msg.occurredAt,
      }),
    );

    // 3. Update each directed edge atomically.
    for (const receiver of msg.receiverAuth0Ids) {
      await this.upsertConnection(msg.senderAuth0Id, receiver, msg.occurredAt);
    }

    // 4. Publish for downstream consumers.
    try {
      await this.eventProducer.publishCommunicationRecorded({
        source: msg.source,
        senderAuth0Id: msg.senderAuth0Id,
        receiverAuth0Ids: msg.receiverAuth0Ids,
        text: msg.text ?? null,
        occurredAt: msg.occurredAt.toISOString(),
      });
    } catch (err) {
      this.logger.error('Failed to publish comms.message.recorded', err);
    }
  }

  /**
   * Atomic upsert:
   *   ON CONFLICT DO UPDATE SET message_count = message_count + 1, last_interaction_at = EXCLUDED...
   * Postgres handles the "two messages arrive at the same time" case for us.
   */
  private async upsertConnection(
    senderAuth0Id: string,
    receiverAuth0Id: string,
    when: Date,
  ): Promise<void> {
    const result: Array<{ message_count: string | number }> =
      await this.dataSource.query(
        `
      INSERT INTO connections
        (id, sender_auth0_id, receiver_auth0_id, message_count,
         first_interaction_at, last_interaction_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 1, $3, $3, NOW())
      ON CONFLICT (sender_auth0_id, receiver_auth0_id) DO UPDATE
      SET message_count       = connections.message_count + 1,
          last_interaction_at = EXCLUDED.last_interaction_at,
          updated_at          = NOW()
      RETURNING message_count
      `,
        [senderAuth0Id, receiverAuth0Id, when],
      );

    const newCount = Number(result[0]?.message_count ?? 0);
    const crossed = CommsService.STRONG_CONNECTION_THRESHOLDS.find(
      (t) => newCount === t,
    );

    if (crossed !== undefined) {
      await this.publishStrongConnection(
        senderAuth0Id,
        receiverAuth0Id,
        newCount,
        crossed,
        when,
      );
    }
  }

  /**
   * Enriches the edge with user records and publishes the event.
   * Best-effort: failures are logged but never bubble up, so a broken
   * downstream consumer never blocks message recording.
   */
  private async publishStrongConnection(
    senderAuth0Id: string,
    receiverAuth0Id: string,
    messageCount: number,
    threshold: number,
    when: Date,
  ): Promise<void> {
    try {
      const users = await this.userRepo.find({
        where: { auth0Id: In([senderAuth0Id, receiverAuth0Id]) },
      });
      const byId = new Map(users.map((u) => [u.auth0Id, u]));
      const sender = byId.get(senderAuth0Id);
      const receiver = byId.get(receiverAuth0Id);

      await this.eventProducer.publishStrongConnection({
        senderAuth0Id,
        senderEmail: sender?.email ?? null,
        senderName: sender?.name ?? null,
        receiverAuth0Id,
        receiverEmail: receiver?.email ?? null,
        receiverName: receiver?.name ?? null,
        messageCount,
        threshold,
        lastInteractionAt: when.toISOString(),
      });

      this.logger.log(
        `Published comms.connection.strong (threshold ${threshold}) ` +
          `${senderAuth0Id} → ${receiverAuth0Id} (weight ${messageCount})`,
      );
    } catch (err) {
      this.logger.error('Failed to publish comms.connection.strong', err);
    }
  }

  // ────────────── Graph endpoint ──────────────

  async getGraph(periodDays = 30): Promise<{
    nodes: { id: string; label: string; department?: string }[];
    edges: {
      source: string;
      target: string;
      weight: number;
      lastInteractionAt: string;
    }[];
  }> {
    const since = new Date(Date.now() - periodDays * 86400000);

    const connections = await this.connRepo.find({
      where: { lastInteractionAt: MoreThanOrEqual(since) },
      order: { lastInteractionAt: 'DESC' },
    });

    // Only include nodes that actually have edges — the frontend can
    // fetch all users separately if it needs an isolated-node view.
    const auth0Ids = new Set<string>();
    for (const c of connections) {
      auth0Ids.add(c.senderAuth0Id);
      auth0Ids.add(c.receiverAuth0Id);
    }

    const users = auth0Ids.size
      ? await this.userRepo.find({ where: { auth0Id: In([...auth0Ids]) } })
      : [];

    const userMap = new Map(users.map((u) => [u.auth0Id, u]));

    const nodes = [...auth0Ids].map((id) => {
      const u = userMap.get(id);
      return {
        id,
        label: u?.name ?? u?.email ?? id,
        department: u?.department,
      };
    });

    const edges = connections.map((c) => ({
      source: c.senderAuth0Id,
      target: c.receiverAuth0Id,
      weight: c.messageCount,
      lastInteractionAt: c.lastInteractionAt.toISOString(),
    }));

    return { nodes, edges };
  }

  async getMessages(options: {
    limit: number;
    senderAuth0Id?: string;
    receiverAuth0Id?: string;
    source?: CommsSource;
    sinceDays?: number;
  }): Promise<MessageRecord[]> {
    const where: Record<string, unknown> = {
      text: Not(IsNull()),
    };
  
    if (options.senderAuth0Id) where.senderAuth0Id = options.senderAuth0Id;
    if (options.source) where.source = options.source;
    if (options.sinceDays && options.sinceDays > 0) {
      where.occurredAt = MoreThanOrEqual(
        new Date(Date.now() - options.sinceDays * 86400000),
      );
    }
  
    // Fetch a buffer when we'll filter in-memory, so the effective
    // result count can still reach `limit`.
    const fetchLimit = options.receiverAuth0Id
      ? options.limit * 3
      : options.limit;
  
    const rows = await this.commRepo.find({
      where,
      order: { occurredAt: 'DESC' },
      take: fetchLimit,
    });
  
    const filtered = options.receiverAuth0Id
      ? rows.filter((r) =>
          r.receiverAuth0Ids.includes(options.receiverAuth0Id!),
        )
      : rows;
  
    return filtered.slice(0, options.limit).map((r) => ({
      id: r.id,
      source: r.source,
      senderAuth0Id: r.senderAuth0Id,
      receiverAuth0Ids: r.receiverAuth0Ids,
      text: r.text ?? null,
      isReply: r.isReply,
      channelExternalId: r.channelExternalId ?? null,
      occurredAt: r.occurredAt.toISOString(),
    }));
  }
}
