import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';
import { MicrosoftModule } from './microsoft/microsoft.module';
import { Report } from './report/entities/report.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { Reportable } from './report/entities/reportable.entity';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [Report, Reportable],
        synchronize: true,
        ssl: {
          rejectUnauthorized: true,
          ca: fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS || '/etc/ssl/certs/root_ca.crt').toString(),
        },
      }),
    }),
    ReportModule,
    AuthModule,
    MicrosoftModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
