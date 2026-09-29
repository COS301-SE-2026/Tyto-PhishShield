import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventProducerService } from './event-producer.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          { name: 'comms-event-exchange', type: 'topic' },
          { name: 'accounts-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  providers: [EventProducerService],
  exports: [EventProducerService],
})
export class EventProducerModule {}