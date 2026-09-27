import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [TypeOrmModule],
})
export class AccountsModule {}
