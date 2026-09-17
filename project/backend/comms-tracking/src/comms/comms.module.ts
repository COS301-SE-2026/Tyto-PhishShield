import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communication } from './entities/communication.entity';
import { Connection } from './entities/connection.entity';
import { CommsUser } from './entities/comms-user.entity';
import { CommsService } from './comms.service';
import { CommsController } from './comms.controller';
import { EventProducerModule } from '../events/event-producer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Communication, Connection, CommsUser]),
    EventProducerModule,
  ],
  providers: [CommsService],
  controllers: [CommsController],
  exports: [CommsService, TypeOrmModule],
})
export class CommsModule {}