import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { EventProducerService } from '@phishshield/eventhandler';
import { DataSource } from 'typeorm';
import { Employee } from '../src/employee/entities/employee.entity';

jest.setTimeout(120000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let postgres: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('comms_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    process.env.DB_HOST = postgres.getHost();
    process.env.DB_PORT = String(postgres.getPort());
    process.env.DB_USERNAME = postgres.getUsername();
    process.env.DB_PASSWORD = postgres.getPassword();
    process.env.DB_NAME = postgres.getDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(EventProducerService).useValue({
      publishEvent: jest.fn(),
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.getRepository(Employee).clear();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('uploads a CSV file and stores employees in PostgreSQL', async () => {
    const csv = [
      'employeeId,email,firstName,lastName,department',
      'emp-001,alice@outlook.com,Alice,Ally,HR',
      'emp-002,bob@outlook.com,Bob,Bobby,Finance',
    ].join('\n');

    await request(app.getHttpServer())
      .post('/import')
      .attach('file', Buffer.from(csv), {
        filename: 'employees.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    await waitForEmployees(dataSource, 2);
    
    const employees = await dataSource.getRepository(Employee).find({
      order: {
        employeeId: 'ASC',
      },
    });

    expect(employees).toHaveLength(2);

    expect(employees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp-001',
          email: 'alice@outlook.com',
          firstName: 'Alice',
          lastName: 'Ally',
          department: 'HR',
        }),
        expect.objectContaining({
          employeeId: 'emp-002',
          email: 'bob@outlook.com',
          firstName: 'Bob',
          lastName: 'Bobby',
          department: 'Finance',
        }),
      ]),
    );
  });


  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
  });
});

async function waitForEmployees(
  dataSource: DataSource,
  expectedCount: number,
  timeoutMs = 10000,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const employees = await dataSource.getRepository(Employee).find();
    if (employees.length === expectedCount) {
      return employees;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Expected ${expectedCount} employees before timeout`);
}