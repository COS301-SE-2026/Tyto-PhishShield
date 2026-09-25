import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

export const rabbitMQModule = RabbitMQModule.forRoot({
  uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  exchanges: [{ name: 'llm-event-exchange', type: 'topic' }],
  connectionInitOptions: {
    wait: false,
  },
});
