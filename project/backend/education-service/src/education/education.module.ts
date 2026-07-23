import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Question } from './entities/question.entity';
import { Assignment } from './entities/assignment.entity';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Assignment]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          { name: 'xp-event-exchange', type: 'topic' },
          { name: 'education-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
      }),
    }),
  ],
  controllers: [EducationController],
  providers: [EducationService],
})
export class EducationModule {}
