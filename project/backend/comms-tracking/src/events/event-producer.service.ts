import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export interface CommunicationRecordedEvent {
  source: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  occurredAt: string;
}

export interface StrongConnectionEvent {
  senderAuth0Id: string;
  senderEmail: string | null;
  senderName: string | null;
  receiverAuth0Id: string;
  receiverEmail: string | null;
  receiverName: string | null;
  messageCount: number;
  threshold: number;
  lastInteractionAt: string;
}

@Injectable()
export class EventProducerService {
  public static readonly EVENT_EXCHANGE = 'comms-event-exchange';

  constructor(private readonly rmq: AmqpConnection) {}

  publishCommunicationRecorded(payload: CommunicationRecordedEvent) {
    return this.rmq.publish(
      EventProducerService.EVENT_EXCHANGE,
      'comms.message.recorded',
      payload,
    );
  }

  publishStrongConnection(payload: StrongConnectionEvent) {
    return this.rmq.publish(
      EventProducerService.EVENT_EXCHANGE,
      'comms.connection.strong',
      payload,
    );
  }
}
