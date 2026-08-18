import { Module } from '@nestjs/common';
import { WaveController } from './wave.controller';
import { WaveService } from './wave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaveEntity } from '../entities/wave.entity';
import { WaveRecipientEntity } from '../entities/wave-recipient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WaveEntity, WaveRecipientEntity])],
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
