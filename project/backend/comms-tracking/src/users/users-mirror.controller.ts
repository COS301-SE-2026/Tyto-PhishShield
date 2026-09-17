import { Controller, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { UsersMirrorService } from './users-mirror.service';

interface AccountUserPayload {
  auth0Id: string;
  email?: string;
  name?: string;
  department?: string;
  role?: string;
}

@Controller()
export class UsersMirrorController {
  private readonly logger = new Logger(UsersMirrorController.name);

  constructor(private readonly usersMirror: UsersMirrorService) {}

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.created',
    queue: 'comms-user-created-queue',
  })
  async onUserCreated(payload: AccountUserPayload) {
    this.logger.log(`user.created: ${payload.auth0Id}`);
    await this.usersMirror.upsertUser(payload);
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.updated',
    queue: 'comms-user-updated-queue',
  })
  async onUserUpdated(payload: AccountUserPayload) {
    this.logger.log(`user.updated: ${payload.auth0Id}`);
    await this.usersMirror.upsertUser(payload);
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.deleted',
    queue: 'comms-user-deleted-queue',
  })
  async onUserDeleted(payload: { auth0Id: string }) {
    this.logger.log(`user.deleted: ${payload.auth0Id}`);
    await this.usersMirror.markDeleted(payload.auth0Id);
  }
}