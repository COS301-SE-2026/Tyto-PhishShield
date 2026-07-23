import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

export const mailingRabbitMQModule = RabbitMQModule.forRoot({
  uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  exchanges: [{ name: 'mailing-event-exchange', type: 'topic' }],
});
