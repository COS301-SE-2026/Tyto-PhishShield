/*
 * Services for the different events that is emited to the accounts-event-queue
 */
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventUser } from '@phishshield/dto';

@Injectable()
export class EventProducerService {
  public static readonly EVENT_EXCHANGE: string = 'accounts-event-exchange';
  constructor(private readonly rmqClient: AmqpConnection) {}

  publishUserCreatedEvent(user: EventUser) {
    return this.rmqClient.publish(
      EventProducerService.EVENT_EXCHANGE,
      'user.created',
      user,
    );
  }

  publishUserUpdatedEvent(user: EventUser) {
    return this.rmqClient.publish(
      EventProducerService.EVENT_EXCHANGE,
      'user.updated',
      user,
    );
  }

  publishUserDeletedEvent(user: EventUser) {
    return this.rmqClient.publish(
      EventProducerService.EVENT_EXCHANGE,
      'user.deleted',
      user,
    );
  }
}
