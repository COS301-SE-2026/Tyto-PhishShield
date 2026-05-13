import { Module } from '@nestjs/common';
import { MailingServiceService } from './mailing-service.service';
import { MailingServiceController } from './mailing-service.controller';

@Module({
  controllers: [MailingServiceController],
  providers: [MailingServiceService],
})
export class MailingServiceModule {}
