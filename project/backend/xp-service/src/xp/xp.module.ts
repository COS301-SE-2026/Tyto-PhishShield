import { Module } from '@nestjs/common';
import { XpService } from './xp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { XpEntity } from '../entities/xp.entity';
import { XpController } from './xp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, XpEntity])],
  providers: [XpService],
  controllers: [XpController],
})
export class XpModule {}
