/*
 * Services for the different events that is emited to the accounts-event-queue
 */
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export enum EVENT_EXCHANGE {
  accounts = 'accounts-event-exchange',
  company = 'company-event-exchange',
}

@Injectable()
export class EventProducerService {
  constructor(private readonly rmqClient: AmqpConnection) {}

  publishEvent(eventExchange: EVENT_EXCHANGE, routingKey: string, body: any) {
    this.rmqClient.publish(eventExchange, routingKey, body);
  }
}
