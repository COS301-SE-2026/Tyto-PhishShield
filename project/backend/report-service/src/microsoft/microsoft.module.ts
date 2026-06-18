import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MicrosoftService } from './microsoft.service';
import { MicrosoftController } from './microsoft.controller';

@Module({
  imports: [HttpModule],
  controllers: [MicrosoftController],
  providers: [MicrosoftService],
  exports: [MicrosoftService],
})
export class MicrosoftModule {}
