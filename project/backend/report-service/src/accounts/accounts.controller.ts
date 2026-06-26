import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { User } from './dto/user.dto';

@Controller('accounts')
export class AccountsController {
  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.created',
    queue: 'report-accounts-queue',
  })
  createUser(user: User) {
    console.log('Creating User in report service', user);
  }
}
