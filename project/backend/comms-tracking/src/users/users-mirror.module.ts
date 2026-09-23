import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommsUser } from '../comms/entities/comms-user.entity';
import { UsersMirrorService } from './users-mirror.service';
import { UsersMirrorController } from './users-mirror.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommsUser])],
  providers: [UsersMirrorService],
  controllers: [UsersMirrorController],
  exports: [UsersMirrorService],
})
export class UsersMirrorModule {}
