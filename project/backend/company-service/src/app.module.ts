import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImportModule } from './import/import.module';
import { EmployeeModule } from './employee/employee.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import } from './import/entities/import.entity';
import { Employee } from './employee/entities/employee.entity';
import * as fs from 'fs';
import { FailedImport } from './employee/entities/failed-import.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => { 
        const useSsl = config.get<string>('DB_SSL') === 'true';
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_NAME'),
          entities: [Import, Employee, FailedImport],
          synchronize: true,
          ssl: useSsl ? {
            rejectUnauthorized: true,
            ca: fs
              .readFileSync(
                process.env.NODE_EXTRA_CA_CERTS || '/etc/ssl/certs/root_ca.crt',
              )
              .toString(),
          } : false,
        };
      },
    }),
    ImportModule,
    EmployeeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
