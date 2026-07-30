import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Report } from './entities/report.entity';
import { Reportable } from './entities/reportable.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Reportable]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          { name: 'xp-event-exchange', type: 'topic' },
          { name: 'mailing-event-exchange', type: 'topic' },
          { name: 'education-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: {
          wait: false,
        },
      }),
    }),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
