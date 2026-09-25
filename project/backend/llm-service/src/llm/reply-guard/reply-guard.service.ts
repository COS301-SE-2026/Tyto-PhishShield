import { Injectable } from '@nestjs/common';

const EVENT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReplyGuardService {
  private readonly seenEvents = new Map<string, number>();

  claimEvent(eventId: string): boolean {
    const now = Date.now();
    this.sweep(now);

    if (this.seenEvents.has(eventId)) return false;
    this.seenEvents.set(eventId, now + EVENT_TTL_MS);
    return true;
  }

  private sweep(now: number): void {
    for (const [id, expiresAt] of this.seenEvents) {
      if (expiresAt <= now) this.seenEvents.delete(id);
      else break;
    }
  }
}
