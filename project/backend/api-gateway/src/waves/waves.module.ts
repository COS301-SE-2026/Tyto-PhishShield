import { Module } from '@nestjs/common';
import { WaveController } from './wave/wave.controller';
import { BatchEmailController } from './batch-email/batch-email.controller';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  controllers: [WaveController, BatchEmailController],
  imports: [ConfigModule, ProxyModule]
})
export class WavesModule {}
