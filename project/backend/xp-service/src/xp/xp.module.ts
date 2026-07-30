import { Module } from '@nestjs/common';
import { XpService } from './xp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { XpEntity } from '../entities/xp.entity';
import { XpController } from './xp.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, XpEntity]),
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'xp-event-exchange',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: {
        wait: false,
      },
    }),
  ],
  providers: [XpService],
  controllers: [XpController],
  exports: [TypeOrmModule],
})
export class XpModule {}
