import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

export const mailingRabbitMQModule = RabbitMQModule.forRoot({
  uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  exchanges: [
    { name: 'waves-event-exchange', type: 'topic' },
    { name: 'mailing-event-exchange', type: 'topic' },
    { name: 'accounts-event-exchange', type: 'topic' },
  ],
  connectionInitOptions: {
    wait: false,
  },
});
