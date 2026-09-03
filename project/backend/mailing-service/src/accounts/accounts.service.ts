/**
 * Service: mailing-service
 *
 * Contains the business logic for account (user) operations.
 * Manages user records in the database, syncing them from Auth0 events via RabbitMQ.
 *
 * Functions:
 * - {@link AccountsService#createUser} - Creates or updates a user in the database.
 */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { User } from '../dto/user.dto';
import { EventUser } from '@phishshield/dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(user: User): Promise<void> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values({
          id: user.id,
          auth0Id: user.auth0Id,
          name: user.name,
          email: user.email,
          department: user.department,
        })
        .orUpdate(['name', 'email', 'department'], ['auth0Id'], {
          skipUpdateIfNoValuesChanged: true,
        })
        .execute();
      this.logger.log(`Upserted user ${user.auth0Id}`);
    } catch (error) {
      this.logger.error(`Failed to upsert user ${user.auth0Id}`, error);
      throw new InternalServerErrorException(
        `Failed to create or update user ${user.auth0Id}`,
      );
    }
  }

  async deleteUser(user: EventUser) {
    await this.userRepository.delete({ auth0Id: user.auth0Id });
  }
}
