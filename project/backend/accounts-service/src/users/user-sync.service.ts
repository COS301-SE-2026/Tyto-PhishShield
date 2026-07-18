import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { EventProducerService } from '../event-producer/event-producer.service';

@Injectable()
export class UserSyncService implements OnModuleInit {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly eventProducer: EventProducerService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv !== 'development') {
      return;
    }

    this.logger.log('Development mode - syncing  all existing users...');
    const users = await this.usersService.findAll();

    for (const user of users) {
      this.eventProducer.publishUserCreatedEvent({
        id: user.id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email,
        department: '',
      });
    }

    this.logger.log(`Synced ${users.length} users.`);
  }
}
