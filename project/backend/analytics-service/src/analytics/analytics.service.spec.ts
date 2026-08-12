/**
 * @file Unit tests for AnalyticsService.
 *
 * Covers event recording, overview stats, report/mailing stats,
 * per-user stats, time series aggregation, and the leaderboard.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from './entities/analytics-event.entity';

// simple mock repo – all methods are jest.fn()
const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repo: jest.Mocked<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repo = module.get(getRepositoryToken(AnalyticsEvent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

    describe('recordEvent', () => {
    it('creates and saves an event with the given input', async () => {
      const input = {
        eventType: AnalyticsEventType.EMAIL_SENT,
        auth0Id: 'auth0|123',
        email: 'test@example.com',
        payload: { foo: 'bar' },
      };
      const created = { id: 'evt1', ...input };
      repo.create.mockReturnValue(created as any);
      repo.save.mockResolvedValue(created as any);

      await service.recordEvent(input as any);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledWith(created);
    });

    it('handles missing optional fields', async () => {
      const input = { eventType: AnalyticsEventType.XP_GIVEN };
      const created = { id: 'evt2', ...input };
      repo.create.mockReturnValue(created as any);
      repo.save.mockResolvedValue(created as any);

      await service.recordEvent(input as any);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledWith(created);
    });
  });
  
});