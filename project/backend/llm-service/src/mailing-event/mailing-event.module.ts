import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentSimulationMessageEntity } from './entities/sent-simulation-message.entity';
import { MailingEventService } from './mailing-event.service';
import { MailingEventController } from './mailing-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SentSimulationMessageEntity])],
  controllers: [MailingEventController],
  providers: [MailingEventService],
  exports: [MailingEventService],
})
export class MailingEventModule {}
