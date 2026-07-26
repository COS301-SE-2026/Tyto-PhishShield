import { Module } from '@nestjs/common';
import { XpWebsocketController } from './xp-websocket/xp-websocket.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { XpWebsocketGateway } from './xp-websocket/xp-websocket.gateway';
import { WebsocketTicketService } from './websocket-ticket.service';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'xp-event-exchange',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [XpWebsocketController],
  providers: [XpWebsocketGateway, WebsocketTicketService],
})
export class WebsocketModule {}
