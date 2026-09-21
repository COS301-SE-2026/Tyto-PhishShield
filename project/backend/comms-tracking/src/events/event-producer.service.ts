import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export interface CommunicationRecordedEvent {
  source: string;
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  occurredAt: string;
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
}
