import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';

export interface ScheduleDecision {
  instant: boolean;
  scheduledAt?: Date;
}

@Injectable()
export class ScheduleResolverService {
  private readonly minLeadMs: number;

  constructor(private readonly config: ConfigService) {
    const minLeadMinutes = this.config.get<number>(
      'SCHEDULE_MIN_LEAD_MINUTES',
      5,
    );
    this.minLeadMs = minLeadMinutes * 60_000;
  }

  resolve(
    scheduledFrom?: Date,
    scheduledTo?: Date,
    now: Date = new Date(),
  ): ScheduleDecision {
    if (!scheduledFrom && !scheduledTo) {
      return { instant: true };
    }

    if (!scheduledFrom && scheduledTo) {
      if (scheduledTo.getTime() - now.getTime() < this.minLeadMs) {
        return { instant: true };
      }
      const randomTime = randomInt(
        now.getTime(),
        scheduledTo.getTime(),
      );
      return { instant: false, scheduledAt: new Date(randomTime) };
    }

    if (scheduledFrom && !scheduledTo) {
      if (scheduledFrom.getTime() - now.getTime() < this.minLeadMs) {
        return { instant: true };
      }
      return { instant: false, scheduledAt: scheduledFrom };
    }

    const fromTime = scheduledFrom.getTime();
    const toTime = scheduledTo.getTime();
    const invalidRange = toTime <= fromTime;
    const tooCloseOrPast =
      fromTime - now.getTime() < this.minLeadMs ||
      toTime - now.getTime() < this.minLeadMs;

    if (invalidRange || tooCloseOrPast) {
      return { instant: true };
    }

    const randomTime = randomInt(fromTime, toTime);

    return { instant: false, scheduledAt: new Date(randomTime) };
  }
}
