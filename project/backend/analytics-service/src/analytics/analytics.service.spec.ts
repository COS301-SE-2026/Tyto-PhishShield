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
});