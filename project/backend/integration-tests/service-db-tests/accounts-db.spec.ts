import { PostgreSQLFactory } from './postgreSQL-setup';
import { Test } from '@nestjs/testing';
import { NestApplication, NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { applyMixins } from 'rxjs/internal/util/applyMixins';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('Accounts to DB integration Test', () => {
    let accountsApp: NestApplication;
    let accountsDB: StartedPostgreSqlContainer;
    let dataSource: DataSource;

    beforeAll(async () => {
        accountsDB = await PostgreSQLFactory.createContainer();

        process.env.DB_HOST = accountsDB.getHost();
        process.env.DB_PORT = accountsDB.getPort().toString();
        process.env.DB_USER = accountsDB.getUsername();
        process.env.DB_PASSWORD = accountsDB.getPassword();
        process.env.DB_NAME = accountsDB.getDatabase();

        const { AppModule } = await import('../../accounts-service/src/app.module');

        accountsApp = await NestFactory.create(AppModule, {logger: false});
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