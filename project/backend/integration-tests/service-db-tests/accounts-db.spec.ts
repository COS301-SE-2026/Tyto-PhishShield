import { PostgreSQLFactory } from './postgreSQL-setup';
import { Test } from '@nestjs/testing';
import { NestApplication, NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { applyMixins } from 'rxjs/internal/util/applyMixins';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../accounts-service/src/users/entities/user.entity';
import { Otp } from '../../accounts-service/src/otp/otp.entity';

describe('Accounts to DB integration Test', () => {
    let accountsApp: NestApplication;
    let accountsDB: StartedPostgreSqlContainer;
    let dataSource: DataSource;

    beforeAll(async () => {
        accountsDB = await PostgreSQLFactory.createContainer();

        process.env.DB_HOST = accountsDB.getHost();
        process.env.DB_PORT = accountsDB.getPort().toString();
        process.env.DB_USERNAME = accountsDB.getUsername();
        process.env.DB_PASSWORD = accountsDB.getPassword();
        process.env.DB_NAME = accountsDB.getDatabase();

        const { UsersModule } = await import('../../accounts-service/src/users/users.module');
        const accountsTestModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get<number>('DB_PORT', 5432),
                    username: config.get('DB_USERNAME'),
                    password: config.get('DB_PASSWORD'),
                    database: config.get('DB_NAME'),
                    entities: [User, Otp],
                    synchronize: true,
                    }),
                }),
                UsersModule
            ],

        }).compile();
        accountsApp = accountsTestModule.createNestApplication();
        await accountsApp.init();

        dataSource = accountsApp.get(DataSource);
    }, 60000);

    afterAll(async () => {
        await accountsApp?.close();
        await PostgreSQLFactory.stopAllContainers();
    })

    it('connects to the Testcontainers PostgreSQL database', async () => {
        const result = await dataSource.query('select current_database() as db');
        expect(result[0].db).toBe(accountsDB.getDatabase());
    });
});