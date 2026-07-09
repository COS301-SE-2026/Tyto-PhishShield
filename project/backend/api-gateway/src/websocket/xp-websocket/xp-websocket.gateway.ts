import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/xp-websocket',
})
export class XpWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(XpWebsocketGateway.name);

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket): Promise<void> {
    const auth0Id = client.handshake.auth?.auth0Id as string | undefined;

    if (!auth0Id) {
      this.logger.warn(
        `Client ${client.id} connected without auth0Id, disconnecting`,
      );
      client.disconnect(true);
      return;
    }

    await client.join(auth0Id);
    this.logger.log(`Client ${client.id} connected and joined room ${auth0Id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitXpUpdate(auth0Id: string, amount: number): void {
    this.server.to(auth0Id).emit('xp-given', amount);
  }
}
