/**
 * UsersModule — contains user entity, service and repository wiring.
 *
 * - Exposes user management functionality (create, read, update) for the accounts service.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService], // exported so AuthModule can use it
})
export class UsersModule {}
