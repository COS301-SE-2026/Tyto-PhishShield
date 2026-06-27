// TODO add comments / add logs / find out what is happening

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { User } from '../dto/user.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(user: User): Promise<void> {
    await this.userRepository.upsert(
      {
        id: user.id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      { conflictPaths: ['auth0Id'], skipUpdateIfNoValuesChanged: true },
    );
    this.logger.log(`Upserted user ${user.auth0Id}`);
  }
}
