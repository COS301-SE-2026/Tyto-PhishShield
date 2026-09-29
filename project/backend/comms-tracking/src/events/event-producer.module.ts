import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventProducerService } from './event-producer.service';

@Module({
  imports: [RabbitMQModule],
  providers: [EventProducerService],
  exports: [EventProducerService],
})
export class EventProducerModule {}