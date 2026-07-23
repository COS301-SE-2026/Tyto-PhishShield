import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { XpWebsocketGateway } from './xp-websocket.gateway';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { WebsocketTicketService } from '../websocket-ticket.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import type { GatewayUser } from '../../auth/strategies/jwt.strategy';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@Controller('xp-websocket')
export class XpWebsocketController {
  constructor(
    private readonly xpWebsocketGateway: XpWebsocketGateway,
    private readonly websocketTicketService: WebsocketTicketService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('ticket')
  issueTicket(@Req() req: AuthenticatedRequest) {
    const ticket = this.websocketTicketService.issueTicket(req.user.auth0Id);
    return { ticket };
  }

  @Public()
  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: 'xp.given',
    queue: 'api-gateway.xp-given-queue',
  })
  handleXpGiven(data: { auth0Id: string; amount: number }) {
    this.xpWebsocketGateway.emitXpUpdate(data.auth0Id, data.amount);
  }
}
