import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    await this.userRepo.save(
      this.userRepo.create({
        auth0Id: payload.auth0Id,
        email: payload.email,
        name: payload.name,
        department: payload.department,
        isActive: true,
      }),
    );
  }

  async markDeleted(auth0Id: string): Promise<void> {
    // Soft delete: keep the row so graph history still resolves names.
    await this.userRepo.update({ auth0Id }, { isActive: false });
  }
}
