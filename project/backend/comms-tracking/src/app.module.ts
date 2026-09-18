import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { CommsModule } from './comms/comms.module';
import { SlackModule } from './comms/providers/slack/slack.module';
import { UsersMirrorModule } from './users/users-mirror.module';

import { Communication } from './comms/entities/communication.entity';
import { Connection } from './comms/entities/connection.entity';
import { CommsUser } from './comms/entities/comms-user.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME', 'comms_tracking'),
        entities: [Communication, Connection, CommsUser],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: true, // dev only
      }),
    }),

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          { name: 'comms-event-exchange', type: 'topic' },
          { name: 'accounts-event-exchange', type: 'topic' },
        ],
        enableControllerDiscovery: true,
        connectionInitOptions: { wait: false },
      }),
    }),
    CommsModule,
    SlackModule,
    UsersMirrorModule,
  ],
})
export class AppModule {}