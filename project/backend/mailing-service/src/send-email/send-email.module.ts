import { Module } from '@nestjs/common';
import { SendEmailController } from './send-email.controller';
import { SendEmailService } from './send-email.service';

@Module({
  controllers: [SendEmailController],
  providers: [SendEmailService],
})
export class SendEmailModule {}
