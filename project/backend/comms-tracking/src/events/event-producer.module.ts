import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventProducerService } from './event-producer.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
          exchanges: [
            { name: EventProducerService.EVENT_EXCHANGE, type: 'topic' },
          ],
          connectionInitOptions: { wait: false },
        }
      },
    }),
  ],
  providers: [EventProducerService],
  exports: [EventProducerService],
})
export class EventProducerModule {}
