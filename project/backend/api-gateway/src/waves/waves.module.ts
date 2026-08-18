import { Module } from '@nestjs/common';
import { WaveController } from './wave/wave.controller';
import { BatchEmailController } from './batch-email/batch-email.controller';

@Module({
  controllers: [WaveController, BatchEmailController],
})
export class WavesModule {}
