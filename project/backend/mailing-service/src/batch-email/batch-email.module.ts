import { Module } from '@nestjs/common';
import { BatchEmailController } from './batch-email.controller';
import { BatchEmailService } from './batch-email.service';

@Module({
  controllers: [BatchEmailController],
  providers: [BatchEmailService]
})
export class BatchEmailModule {}
