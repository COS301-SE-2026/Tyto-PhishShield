import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Question } from './entities/question.entity';
import { Assignment } from './entities/assignment.entity';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Assignment]),
    ClientsModule.registerAsync([
      {
        name: 'EDUCATION_EVENTS',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'events.queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [EducationController],
  providers: [EducationService],
})
export class EducationModule {}