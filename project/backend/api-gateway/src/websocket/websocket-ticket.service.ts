import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const TTL_MS = 1000 * 10;

interface Ticket {
  auth0Id: string;
  expiresAt: number;
}

@Injectable()
export class WebsocketTicketService {
  private readonly tickets = new Map<string, Ticket>();

  issueTicket(auth0Id: string): string {
    this.cleanup();
    const ticket = randomUUID();
    this.tickets.set(ticket, { auth0Id, expiresAt: Date.now() + TTL_MS });
    return ticket;
  }

  consumeTicket(ticket: string): string | null {
    const entry = this.tickets.get(ticket);
    this.tickets.delete(ticket);

    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.auth0Id;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.tickets) {
      if (value.expiresAt < now) this.tickets.delete(key);
    }
  }
}
