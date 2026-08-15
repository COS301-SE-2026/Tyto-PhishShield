import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          { name: 'report-event-exchange', type: 'topic' },
          { name: 'xp-event-exchange', type: 'topic' },
          { name: 'education-event-exchange', type: 'topic' },
          { name: 'mailing-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
