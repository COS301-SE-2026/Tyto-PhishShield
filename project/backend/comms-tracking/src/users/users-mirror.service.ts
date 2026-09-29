import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CommsUser } from '../comms/entities/comms-user.entity';

interface AccountUserPayload {
  auth0Id: string;
  email?: string;
  name?: string;
  department?: string;
  role?: string;
}

@Injectable()
export class UsersMirrorService {
  private readonly logger = new Logger(UsersMirrorService.name);

  constructor(
    @InjectRepository(CommsUser)
    private readonly userRepo: Repository<CommsUser>,
  ) {}

  async upsertUser(payload: AccountUserPayload): Promise<void> {
    const existing = await this.userRepo.findOne({
      where: { auth0Id: payload.auth0Id },
    });
    if (existing) {
      // Preserve the slackId if we've already mapped this user.
      Object.assign(existing, {
        email: payload.email ?? existing.email,
        name: payload.name ?? existing.name,
        department: payload.department ?? existing.department,
      });
      await this.userRepo.save(existing);
      return;
    }

    try {
      await this.userRepo.save(
        this.userRepo.create({
          auth0Id: payload.auth0Id,
          email: payload.email,
          name: payload.name,
          department: payload.department,
          isActive: true,
        }),
      );
    } catch (err) {
      // Race: two user.created events for the same auth0Id arrived
      // close together and both passed the findOne check. The first
      // one inserted the row; the second hits the primary-key unique
      // constraint. That's fine — the row exists, this event is a no-op.
      if (err instanceof QueryFailedError) {
        const driverError = err.driverError as { code?: string } | undefined;
        if (driverError?.code === '23505') {
          this.logger.warn(
            `Duplicate user.created for ${payload.auth0Id}, ignoring`,
          );
          return;
        }
      }
      // Genuinely unexpected DB error — log but don't requeue the message.
      this.logger.error(
        `Failed to upsert comms user ${payload.auth0Id}`,
        err as Error,
      );
    }
  }

  async markDeleted(auth0Id: string): Promise<void> {
    await this.userRepo.update({ auth0Id }, { isActive: false });
  }
}
