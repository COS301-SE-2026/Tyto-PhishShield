import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'accounts-event-exchange',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: {
        wait: false,
      },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
