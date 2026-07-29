import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebsocketTicketService } from '../websocket-ticket.service';

interface SocketData {
  auth0Id: string;
}

type AuthenticatedSocket = Socket<any, any, any, SocketData>;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/api/xp-websocket',
})
export class XpWebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(XpWebsocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly websocketTicketService: WebsocketTicketService,
  ) {}

  afterInit(server: Server): void {
    server.use((socket: AuthenticatedSocket, next) => {
      const ticket = socket.handshake.auth?.ticket as string | undefined;
      const auth0Id = ticket
        ? this.websocketTicketService.consumeTicket(ticket)
        : null;

      if (!auth0Id) {
        return next(new Error('Unauthorized'));
      }

      socket.data.auth0Id = auth0Id;
      next();
    });
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const auth0Id = client.data.auth0Id;
    await client.join(auth0Id);
    this.logger.log(`Client ${client.id} connected and joined room ${auth0Id}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitXpUpdate(auth0Id: string, amount: number): void {
    this.server.to(auth0Id).emit('xp-given', amount);
    this.server.emit('xp-given-all', {
      auth0Id: auth0Id,
      amount: amount,
    });
  }
}
