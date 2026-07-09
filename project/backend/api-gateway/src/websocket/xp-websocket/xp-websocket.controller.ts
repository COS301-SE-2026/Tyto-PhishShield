import { Controller } from '@nestjs/common';
import { XpWebsocketGateway } from './xp-websocket.gateway';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller('xp-websocket')
export class XpWebsocketController {
  constructor(private readonly xpWebsocketGateway: XpWebsocketGateway) {}

  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: 'xp.given',
    queue: 'api-gateway.xp-given-queue',
  })
  handleXpGiven(data: { auth0Id: string; amount: number }) {
    this.xpWebsocketGateway.emitXpUpdate(data.auth0Id, data.amount);
  }
}
