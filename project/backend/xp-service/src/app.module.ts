import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { XpModule } from './xp/xp.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { XpEntity } from './entities/xp.entity';
import { EmailDetailsEntity } from './entities/email-details.entity';
import { ReviewModule } from './review/review.module';
import { ReviewEntity } from './entities/review.entity';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MessagingModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('XP_DB_CONTAINER'),
        port: configService.get<number>('INTERNAL_DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('XP_DB_NAME'),
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        entities: [UserEntity, XpEntity, EmailDetailsEntity, ReviewEntity],
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      XpEntity,
      EmailDetailsEntity,
      ReviewEntity,
    ]),
    AccountsModule,
    XpModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
