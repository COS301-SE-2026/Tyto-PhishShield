/**
 * Unit tests for CommsService.
 *
 * Covers:
 * - recordCommunication idempotency (duplicate externalMessageId is a no-op)
 * - recordCommunication happy path (persist + upsert edges + publish)
 * - atomic edge upsert via DataSource.query
 * - getGraph aggregation (nodes + edges, dedupes users)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CommsService } from './comms.service';
import { Communication, CommsSource } from './entities/communication.entity';
import { Connection } from './entities/connection.entity';
import { CommsUser } from './entities/comms-user.entity';
import { EventProducerService } from '../events/event-producer.service';
import { NormalizedMessage } from './providers/comms-provider.interface';

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

describe('CommsService', () => {
  let service: CommsService;
  let commRepo: jest.Mocked<typeof mockCommRepo>;
  let connRepo: jest.Mocked<typeof mockConnRepo>;
  let userRepo: jest.Mocked<typeof mockUserRepo>;
  let eventProducer: jest.Mocked<typeof mockEventProducer>;
  let dataSource: jest.Mocked<typeof mockDataSource>;

  const baseMessage: NormalizedMessage = {
    source: CommsSource.SLACK,
    externalMessageId: '1700000000.000100',
    senderAuth0Id: 'auth0|alice',
    receiverAuth0Ids: ['auth0|bob'],
    channelExternalId: 'C123',
    isReply: false,
    parentExternalId: undefined,
    occurredAt: new Date('2026-09-01T10:00:00Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommsService,
        { provide: getRepositoryToken(Communication), useValue: mockCommRepo },
        { provide: getRepositoryToken(Connection), useValue: mockConnRepo },
        { provide: getRepositoryToken(CommsUser), useValue: mockUserRepo },
        { provide: EventProducerService, useValue: mockEventProducer },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(CommsService);
    commRepo = module.get(getRepositoryToken(Communication));
    connRepo = module.get(getRepositoryToken(Connection));
    userRepo = module.get(getRepositoryToken(CommsUser));
    eventProducer = module.get(EventProducerService);
    dataSource = module.get(DataSource);
  });

  describe('recordCommunication', () => {
    it('is a no-op when the message is already recorded', async () => {
      commRepo.findOne.mockResolvedValue({ id: 'existing' } as any);

      await service.recordCommunication(baseMessage);

      expect(commRepo.findOne).toHaveBeenCalledWith({
        where: {
          source: CommsSource.SLACK,
          externalMessageId: baseMessage.externalMessageId,
        },
      });
      expect(commRepo.create).not.toHaveBeenCalled();
      expect(commRepo.save).not.toHaveBeenCalled();
      expect(dataSource.query).not.toHaveBeenCalled();
      expect(
        eventProducer.publishCommunicationRecorded,
      ).not.toHaveBeenCalled();
    });

    it('persists the communication, upserts each edge, and publishes the event', async () => {
      commRepo.findOne.mockResolvedValue(null);
      const created = { id: 'comm-1', ...baseMessage };
      commRepo.create.mockReturnValue(created as any);
      commRepo.save.mockResolvedValue(created as any);
      dataSource.query.mockResolvedValue(undefined);
      eventProducer.publishCommunicationRecorded.mockResolvedValue(undefined);

      await service.recordCommunication(baseMessage);

      expect(commRepo.create).toHaveBeenCalledWith({
        source: CommsSource.SLACK,
        externalMessageId: baseMessage.externalMessageId,
        senderAuth0Id: baseMessage.senderAuth0Id,
        receiverAuth0Ids: baseMessage.receiverAuth0Ids,
        channelExternalId: baseMessage.channelExternalId,
        isReply: baseMessage.isReply,
        parentExternalId: baseMessage.parentExternalId,
        occurredAt: baseMessage.occurredAt,
      });
      expect(commRepo.save).toHaveBeenCalled();

      // One upsert per receiver — the raw SQL takes the two ids + a date.
      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const [sql, params] = dataSource.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO connections');
      expect(sql).toContain('ON CONFLICT');
      expect(params).toEqual([
        baseMessage.senderAuth0Id,
        baseMessage.receiverAuth0Ids[0],
        baseMessage.occurredAt,
      ]);

      expect(
        eventProducer.publishCommunicationRecorded,
      ).toHaveBeenCalledWith({
        source: CommsSource.SLACK,
        senderAuth0Id: baseMessage.senderAuth0Id,
        receiverAuth0Ids: baseMessage.receiverAuth0Ids,
        occurredAt: baseMessage.occurredAt.toISOString(),
      });
    });

    it('upserts one edge per receiver when there are multiple mentions', async () => {
      commRepo.findOne.mockResolvedValue(null);
      commRepo.create.mockReturnValue({} as any);
      commRepo.save.mockResolvedValue({} as any);
      dataSource.query.mockResolvedValue(undefined);
      eventProducer.publishCommunicationRecorded.mockResolvedValue(undefined);

      const multi: NormalizedMessage = {
        ...baseMessage,
        receiverAuth0Ids: ['auth0|bob', 'auth0|carol', 'auth0|dave'],
      };

      await service.recordCommunication(multi);

      expect(dataSource.query).toHaveBeenCalledTimes(3);
      const receivers = dataSource.query.mock.calls.map((c) => c[1][1]);
      expect(receivers).toEqual([
        'auth0|bob',
        'auth0|carol',
        'auth0|dave',
      ]);
    });

    it('still succeeds when the event publisher throws', async () => {
      commRepo.findOne.mockResolvedValue(null);
      commRepo.create.mockReturnValue({} as any);
      commRepo.save.mockResolvedValue({} as any);
      dataSource.query.mockResolvedValue(undefined);
      eventProducer.publishCommunicationRecorded.mockRejectedValue(
        new Error('broker down'),
      );

      await expect(
        service.recordCommunication(baseMessage),
      ).resolves.toBeUndefined();
    });
  });

  describe('getGraph', () => {
    it('returns empty nodes and edges when no connections exist', async () => {
      connRepo.find.mockResolvedValue([]);

      const result = await service.getGraph(30);

      expect(result).toEqual({ nodes: [], edges: [] });
      expect(userRepo.find).not.toHaveBeenCalled();
    });

    it('builds unique nodes from both endpoints and shapes edges', async () => {
      connRepo.find.mockResolvedValue([
        {
          senderAuth0Id: 'auth0|alice',
          receiverAuth0Id: 'auth0|bob',
          messageCount: 5,
          lastInteractionAt: new Date('2026-09-01T10:00:00Z'),
        },
        {
          senderAuth0Id: 'auth0|alice',
          receiverAuth0Id: 'auth0|carol',
          messageCount: 2,
          lastInteractionAt: new Date('2026-09-01T11:00:00Z'),
        },
      ] as any);

      userRepo.find.mockResolvedValue([
        {
          auth0Id: 'auth0|alice',
          name: 'Alice',
          email: 'alice@example.com',
          department: 'Finance',
        },
        { auth0Id: 'auth0|bob', name: 'Bob' },
        { auth0Id: 'auth0|carol', name: 'Carol' },
      ] as any);

      const result = await service.getGraph(30);

      expect(result.nodes).toHaveLength(3);
      const aliceNode = result.nodes.find((n) => n.id === 'auth0|alice');
      expect(aliceNode).toEqual({
        id: 'auth0|alice',
        label: 'Alice',
        department: 'Finance',
      });

      expect(result.edges).toHaveLength(2);
      expect(result.edges[0]).toEqual({
        source: 'auth0|alice',
        target: 'auth0|bob',
        weight: 5,
        lastInteractionAt: '2026-09-01T10:00:00.000Z',
      });
    });

    it('falls back to email or auth0Id when name is missing', async () => {
      connRepo.find.mockResolvedValue([
        {
          senderAuth0Id: 'auth0|x',
          receiverAuth0Id: 'auth0|y',
          messageCount: 1,
          lastInteractionAt: new Date(),
        },
      ] as any);

      userRepo.find.mockResolvedValue([
        { auth0Id: 'auth0|x', email: 'x@example.com' }, // no name
        // auth0|y missing entirely
      ] as any);

      const result = await service.getGraph(30);

      const x = result.nodes.find((n) => n.id === 'auth0|x');
      const y = result.nodes.find((n) => n.id === 'auth0|y');
      expect(x?.label).toBe('x@example.com');
      expect(y?.label).toBe('auth0|y');
    });

    it('queries connections with a cutoff date based on the period', async () => {
      connRepo.find.mockResolvedValue([]);
      const before = Date.now();

      await service.getGraph(7);

      const call = connRepo.find.mock.calls[0][0] as any;
      const cutoff: Date = call.where.lastInteractionAt.value;
      const expectedCutoff = before - 7 * 86400000;
      // Within a couple of seconds of the expected cutoff
      expect(Math.abs(cutoff.getTime() - expectedCutoff)).toBeLessThan(2000);
    });
  });
});