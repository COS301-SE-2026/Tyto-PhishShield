// TODO: add comments

import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { User } from '../dto/user.dto';
import { AccountsService } from './accounts.service';

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
}
