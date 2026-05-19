# Real-time Gamification & WebSocket Architecture

> References:
> - NestJS WebSocket Gateways: https://docs.nestjs.com/websockets/gateways
> - Socket.IO: https://socket.io/docs/v4/
> - NestJS WebSockets Adapter: https://docs.nestjs.com/websockets/adapter

---

## Concept

The backend gateway API will be developed as a NestJS Express server. The NestJS gateway will handle real-time events, and Socket.IO will be used to manage communication between the frontend and backend.

---

## Set-up

> **Note:** Installed packages will be saved using fixed hashed versions so that the whole project runs on secure, stable versions of the packages.

### Install required packages

```bash
pnpm i --save @nestjs/websockets @nestjs/platform-socket.io
```

### Generate the gateway

```bash
nest generate gateway events
```

### `events.gateway.ts`

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure as needed for security
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: string): string {
    // Returns a message back to the sender
    return data;
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() data: any) {
    // Sends a message to every connected client
    this.server.emit('onMessage', data);
  }
}
```

### Register the gateway in `AppModule`

```typescript
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
})
export class AppModule {}
```

---

## Key Configuration Options

- **Port** — By default, gateways listen on the same port as the HTTP server. A different port can be specified: `@WebSocketGateway(8080)`.
- **Namespaces** — Group logic by adding a namespace: `@WebSocketGateway({ namespace: 'chat' })`.
- **CORS** — If the frontend is on a different domain, CORS must be enabled in the gateway decorator.
