import { Module } from '@nestjs/common';
import { XpService } from './xp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { XpEntity } from '../entities/xp.entity';
import { XpController } from './xp.controller';
import { EmailDetailsEntity } from '../entities/email-details.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, XpEntity, EmailDetailsEntity]),
  ],
  providers: [XpService],
  controllers: [XpController],
  exports: [TypeOrmModule, XpService],
})
export class XpModule {}
