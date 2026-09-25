import { Module } from '@nestjs/common';
import { WaveController } from './wave.controller';
import { WaveService } from './wave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaveEntity } from '../entities/wave.entity';
import { WaveRecipientEntity } from '../entities/wave-recipient.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaveEntity, WaveRecipientEntity]),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'wave-event-exchange',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    }),
  ],
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
