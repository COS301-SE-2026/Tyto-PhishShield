/**
 * UsersModule — contains user entity, service and repository wiring.
 *
 * - Exposes user management functionality (create, read, update) for the accounts service.
 */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { EventProducerModule } from '../event-producer/event-producer.module';
import { UserSyncService } from './user-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    EventProducerModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, UserSyncService], // exported so AuthModule can use it
})
export class UsersModule {}
