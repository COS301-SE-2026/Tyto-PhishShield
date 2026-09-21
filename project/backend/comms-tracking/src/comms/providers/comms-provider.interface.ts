import { CommsSource } from '../entities/communication.entity';

export interface NormalizedMessage {
  source: CommsSource;
  externalMessageId: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  channelExternalId?: string;
  isReply: boolean;
  parentExternalId?: string;
  occurredAt: Date;
}

export interface CommsProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
}
