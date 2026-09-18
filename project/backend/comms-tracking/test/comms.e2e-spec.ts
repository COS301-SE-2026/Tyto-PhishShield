/**
 * Integration tests for the Comms HTTP endpoints.
 *
 * Uses the real CommsController and CommsService with mocked TypeORM repositories.
 * RabbitMQ, Slack, and the DataSource are stubbed because they're not needed for HTTP route testing.
 *
 * Note: this service has no auth guards — auth lives in the API gateway.
 * Auth behaviour is covered in the gateway's own e2e suite.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommsController } from '../src/comms/comms.controller';
import { CommsService } from '../src/comms/comms.service';
import { Communication } from '../src/comms/entities/communication.entity';
import { Connection } from '../src/comms/entities/connection.entity';
import { CommsUser } from '../src/comms/entities/comms-user.entity';
import { EventProducerService } from '../src/events/event-producer.service';

// ─── Mocks: only the DB layer, RabbitMQ, and DataSource ─────────────────────
const mockCommRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockConnRepo = {
  find: jest.fn(),
};

const mockUserRepo = {
  find: jest.fn(),
};

const mockEventProducer = {
  publishCommunicationRecorded: jest.fn(),
};

const mockDataSource = {
  query: jest.fn(),
};

describe('Comms (integration)', () => {
  let app: INestApplication;
  let connRepo: jest.Mocked<typeof mockConnRepo>;
  let userRepo: jest.Mocked<typeof mockUserRepo>;

  beforeAll(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true })],
      controllers: [CommsController],
      providers: [
        CommsService,
        { provide: getRepositoryToken(Communication), useValue: mockCommRepo },
        { provide: getRepositoryToken(Connection), useValue: mockConnRepo },
        { provide: getRepositoryToken(CommsUser), useValue: mockUserRepo },
        { provide: EventProducerService, useValue: mockEventProducer },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    connRepo = moduleFixture.get(getRepositoryToken(Connection));
    userRepo = moduleFixture.get(getRepositoryToken(CommsUser));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('GET /comms/graph', () => {
    it('returns an empty graph when there are no connections', async () => {
      connRepo.find.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/comms/graph')
        .expect(200);

      expect(res.body).toEqual({ nodes: [], edges: [] });
      expect(userRepo.find).not.toHaveBeenCalled();
    });

    it('returns nodes and edges for a populated graph', async () => {
      connRepo.find.mockResolvedValue([
        {
          senderAuth0Id: 'auth0|alice',
          receiverAuth0Id: 'auth0|bob',
          messageCount: 5,
          lastInteractionAt: new Date('2026-09-01T10:00:00Z'),
        },
        {
          senderAuth0Id: 'auth0|bob',
          receiverAuth0Id: 'auth0|alice',
          messageCount: 2,
          lastInteractionAt: new Date('2026-09-01T11:00:00Z'),
        },
      ] as any);

      userRepo.find.mockResolvedValue([
        { auth0Id: 'auth0|alice', name: 'Alice', department: 'Finance' },
        { auth0Id: 'auth0|bob', name: 'Bob', department: 'IT' },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/comms/graph')
        .expect(200);

      expect(res.body.nodes).toHaveLength(2);
      expect(res.body.edges).toHaveLength(2);

      const alice = res.body.nodes.find((n: any) => n.id === 'auth0|alice');
      expect(alice).toEqual({
        id: 'auth0|alice',
        label: 'Alice',
        department: 'Finance',
      });

      const forward = res.body.edges.find(
        (e: any) => e.source === 'auth0|alice' && e.target === 'auth0|bob',
      );
      expect(forward).toEqual({
        source: 'auth0|alice',
        target: 'auth0|bob',
        weight: 5,
        lastInteractionAt: '2026-09-01T10:00:00.000Z',
      });
    });

    it('falls back to email, then auth0Id, when a user record is missing', async () => {
      connRepo.find.mockResolvedValue([
        {
          senderAuth0Id: 'auth0|x',
          receiverAuth0Id: 'auth0|y',
          messageCount: 1,
          lastInteractionAt: new Date('2026-09-01T10:00:00Z'),
        },
      ] as any);

      userRepo.find.mockResolvedValue([
        { auth0Id: 'auth0|x', email: 'x@example.com' },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/comms/graph')
        .expect(200);

      const x = res.body.nodes.find((n: any) => n.id === 'auth0|x');
      const y = res.body.nodes.find((n: any) => n.id === 'auth0|y');
      expect(x.label).toBe('x@example.com');
      expect(y.label).toBe('auth0|y');
    });

    it('uses a 30-day cutoff by default', async () => {
      connRepo.find.mockResolvedValue([]);
      const before = Date.now();

      await request(app.getHttpServer()).get('/comms/graph').expect(200);

      const call = connRepo.find.mock.calls[0][0] as any;
      const cutoff: Date = call.where.lastInteractionAt.value;
      const expected = before - 30 * 86400000;
      expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(2000);
    });

    it('parses 7d into a 7-day window', async () => {
      connRepo.find.mockResolvedValue([]);
      const before = Date.now();

      await request(app.getHttpServer())
        .get('/comms/graph?period=7d')
        .expect(200);

      const call = connRepo.find.mock.calls[0][0] as any;
      const cutoff: Date = call.where.lastInteractionAt.value;
      const expected = before - 7 * 86400000;
      expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(2000);
    });

    it('parses 90d into a 90-day window', async () => {
      connRepo.find.mockResolvedValue([]);
      const before = Date.now();

      await request(app.getHttpServer())
        .get('/comms/graph?period=90d')
        .expect(200);

      const call = connRepo.find.mock.calls[0][0] as any;
      const cutoff: Date = call.where.lastInteractionAt.value;
      const expected = before - 90 * 86400000;
      expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(2000);
    });

    it('falls back to 30 days for an unrecognised period value', async () => {
      connRepo.find.mockResolvedValue([]);
      const before = Date.now();

      await request(app.getHttpServer())
        .get('/comms/graph?period=banana')
        .expect(200);

      const call = connRepo.find.mock.calls[0][0] as any;
      const cutoff: Date = call.where.lastInteractionAt.value;
      const expected = before - 30 * 86400000;
      expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(2000);
    });

    it('sorts connections by lastInteractionAt descending', async () => {
      connRepo.find.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/comms/graph').expect(200);

      const call = connRepo.find.mock.calls[0][0] as any;
      expect(call.order).toEqual({ lastInteractionAt: 'DESC' });
    });
  });
});