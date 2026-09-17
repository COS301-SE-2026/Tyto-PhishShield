import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommsUser } from '../../entities/comms-user.entity';
import { SlackProvider } from './slack.provider';
import { SlackUserMapper } from './slack-user-mapper';
import { CommsModule } from '../../comms.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommsUser]), CommsModule],
  providers: [SlackProvider, SlackUserMapper],
  exports: [SlackUserMapper],
})
export class SlackModule {}