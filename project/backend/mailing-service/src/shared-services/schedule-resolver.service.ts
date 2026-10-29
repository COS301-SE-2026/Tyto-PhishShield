import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';

export interface ScheduleDecision {
  instant: boolean;
  scheduledAt?: Date;
}

// Working hours (local time, 24h clock): 09:00 - 17:00.
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

// How far either side of working hours still counts as "reasonable" (05:00-09:00, 17:00-21:00).
const SHOULDER_HOURS = 4;

// Relative likelihood of each hour being picked. Only the ratios matter.
const PEAK_WEIGHT = 1; // inside working hours
const SHOULDER_WEIGHT = 0.4; // within SHOULDER_HOURS of working hours
const OFF_HOURS_WEIGHT = 0.03; // everything else (late night / very early morning)

// Rejection sampling cap. If every attempt is rejected (e.g. the window sits entirely in
// off-hours) we fall back to a uniform pick, which is correct in that case anyway.
const MAX_SAMPLING_ATTEMPTS = 200;

@Injectable()
export class ScheduleResolverService {
  private readonly minLeadMs: number;
  private readonly hourFormatter: Intl.DateTimeFormat;

  constructor(private readonly config: ConfigService) {
    const minLeadMinutes = this.config.get<number>(
      'SCHEDULE_MIN_LEAD_MINUTES',
      5,
    );
    this.minLeadMs = minLeadMinutes * 60_000;

    const timeZone = this.config.get<string>(
      'SCHEDULE_TIMEZONE',
      'Africa/Johannesburg',
    );
    this.hourFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: 'numeric',
      hourCycle: 'h23',
    });
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
      return {
        instant: false,
        scheduledAt: this.pickWeightedTime(
          now.getTime(),
          scheduledTo.getTime(),
        ),
      };
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

    return {
      instant: false,
      scheduledAt: this.pickWeightedTime(fromTime, toTime),
    };
  }

  pickWeightedTime(fromMs: number, toMs: number): Date {
    for (let attempt = 0; attempt < MAX_SAMPLING_ATTEMPTS; attempt++) {
      const candidate = randomInt(fromMs, toMs);
      const weight = this.weightForHour(this.localHour(new Date(candidate)));

      if (randomInt(0, 1_000_000) / 1_000_000 < weight) {
        return new Date(candidate);
      }
    }

    return new Date(randomInt(fromMs, toMs));
  }

  private localHour(date: Date): number {
    return Number(this.hourFormatter.format(date)) % 24;
  }

  private weightForHour(hour: number): number {
    if (hour >= WORK_START_HOUR && hour < WORK_END_HOUR) {
      return PEAK_WEIGHT;
    }

    if (
      hour >= WORK_START_HOUR - SHOULDER_HOURS &&
      hour < WORK_END_HOUR + SHOULDER_HOURS
    ) {
      return SHOULDER_WEIGHT;
    }

    return OFF_HOURS_WEIGHT;
  }
}
