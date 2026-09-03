/**
 * Service: xp-service
 *
 * Handles incoming RabbitMQ events for account (user) operations.
 *
 * Functions:
 * - {@link AccountsController#createUser} - Creates or updates a user from a RabbitMQ event.
 */

import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { User } from '../dto/user.dto';
import { AccountsService } from './accounts.service';
import { EventUser } from '@phishshield/dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.created',
    queue: 'xp-accounts-queue',
  })
  async createUser(user: User): Promise<void> {
    await this.accountsService.createUser(user);
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.deleted',
    queue: 'xp-accounts-queue',
  })
  async delete(user: EventUser): Promise<void> {
    await this.accountsService.deleteUser(user);
  }
}
