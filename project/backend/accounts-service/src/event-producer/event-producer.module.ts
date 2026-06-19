/*
 * This module handles publishing event to the accounts-event-queue
 */

import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventProducerService } from './event-producer.service';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: EventProducerService.EVENT_EXCHANGE,
          type: 'fanout',
        },
      ],
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    }),
  ],
  providers: [EventProducerService],
  exports: [EventProducerService],
})
export class EventProducerModule {}
