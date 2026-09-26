import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        { name: 'accounts-event-exchange', type: 'topic' },
        { name: 'xp-event-exchange', type: 'topic' },
        { name: 'mailing-event-exchange', type: 'topic' },
        { name: 'llm-event-exchange', type: 'topic' },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: { wait: false },
    }),
  ],
  exports: [RabbitMQModule],
})
export class MessagingModule {}