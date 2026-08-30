import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsUser } from './entities/analytics-user.entity';
import { Campaign } from './entities/campaign.entity';
import { ClickEvent } from './entities/click-event.entity';
import { SimulationSend } from './entities/simulation-send.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEvent,
      AnalyticsUser,
      Campaign,
      ClickEvent,
      SimulationSend,
    ]),
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
          { name: 'accounts-event-exchange', type: 'topic' },
          { name: 'waves-event-exchange', type: 'topic' },
          { name: 'click-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
