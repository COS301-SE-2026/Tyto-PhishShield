import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Report } from './entities/report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    ClientsModule.registerAsync([
      {
        name: 'REPORT_EVENTS',
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
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
