import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { XpWebsocketGateway } from './xp-websocket.gateway';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { WebsocketTicketService } from '../websocket-ticket.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AccountsController } from '../../accounts/accounts.controller';

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  role: string;
}

@Controller('xp-websocket')
export class XpWebsocketController {
  constructor(
    private readonly xpWebsocketGateway: XpWebsocketGateway,
    private readonly websocketTicketService: WebsocketTicketService,
    private readonly accountsController: AccountsController,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('ticket')
  issueTicket(@Req() user: AuthenticatedUser) {
    const ticket = this.websocketTicketService.issueTicket(user.auth0Id);
    return { ticket };
  }

  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: 'xp.given',
    queue: 'api-gateway.xp-given-queue',
  })
  handleXpGiven(data: { auth0Id: string; amount: number }) {
    this.xpWebsocketGateway.emitXpUpdate(data.auth0Id, data.amount);
  }
}
