import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    ClientsModule.register([
      {
        name: 'ANALYTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_HOST ?? 'analytics_app',
          port: Number(process.env.ANALYTICS_TCP_PORT ?? 4006),
        },
      },
    ]),
  ],
  controllers: [DigestController],
  providers: [DigestService],
})
export class DigestModule {}
