import { CommsSource } from '../entities/communication.entity';
// this normalized message is there so that we can record messages from different sources in a uniform way across multiple platforms such as slack, teams or whatever. It is used to record messages from slack, teams, and email.
export interface NormalizedMessage {
  source: CommsSource;
  externalMessageId: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  channelExternalId?: string;

  isReply: boolean;
  parentExternalId?: string;
  text?: string | null;
  occurredAt: Date;
}

export interface CommsProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
}
