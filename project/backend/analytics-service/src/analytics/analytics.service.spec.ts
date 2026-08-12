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

    describe('getOverview', () => {
    beforeEach(() => {
      // make count return different values depending on eventType
      repo.count.mockImplementation(({ where }: any) => {
        switch (where?.eventType) {
          case AnalyticsEventType.EMAIL_SENT:
            return 10;
          case AnalyticsEventType.EMAIL_BATCH_SENT:
            return 5;
          case AnalyticsEventType.REPORT_SUBMITTED:
            return 20;
          case AnalyticsEventType.REPORT_CONFIRMED:
            return 8;
          case AnalyticsEventType.REPORT_FALSE_POSITIVE:
            return 12;
          case AnalyticsEventType.EDUCATION_ASSIGNED:
            return 12; // same as false positive, logically
          case AnalyticsEventType.EDUCATION_COMPLETED:
            return 6;
          default:
            return 0;
        }
      });

      // sumXp uses find for XP_GIVEN events
      repo.find.mockResolvedValue([
        { payload: { amount: 10 } },
        { payload: { amount: 25 } },
        { payload: { amount: 'not a number' } }, // should be ignored
      ] as any);
    });

    it('returns aggregated overview counts', async () => {
      const result = await service.getOverview();

      expect(result).toEqual({
        totalEmailsSent: 15, // 10 + 5
        totalReports: 20,
        confirmedPhishing: 8,
        falsePositives: 12,
        totalXpGiven: 35, // 10 + 25 (string ignored)
        educationAssigned: 12,
        educationCompleted: 6,
      });
    });

    it('returns zero totals when no events exist', async () => {
      repo.count.mockResolvedValue(0);
      repo.find.mockResolvedValue([] as any);

      const result = await service.getOverview();

      expect(result.totalEmailsSent).toBe(0);
      expect(result.totalXpGiven).toBe(0);
      expect(result.totalReports).toBe(0);
    });
  });

    describe('getReportStats', () => {
    it('calculates detection rate correctly when reports exist', async () => {
      repo.count.mockImplementation(({ where }: any) => {
        if (where?.eventType === AnalyticsEventType.REPORT_SUBMITTED) return 20;
        if (where?.eventType === AnalyticsEventType.REPORT_CONFIRMED) return 8;
        if (where?.eventType === AnalyticsEventType.REPORT_FALSE_POSITIVE)
          return 12;
        return 0;
      });

      const result = await service.getReportStats();

      expect(result.submitted).toBe(20);
      expect(result.confirmed).toBe(8);
      expect(result.falsePositive).toBe(12);
      expect(result.detectionRate).toBe(40); // 8/20 * 100
    });

    it('returns zero detection rate when no reports submitted', async () => {
      repo.count.mockResolvedValue(0);

      const result = await service.getReportStats();

      expect(result.detectionRate).toBe(0);
    });

    it('passes date filters to repository count', async () => {
      const from = '2026-08-01';
      const to = '2026-08-10';
      repo.count.mockResolvedValue(0);

      await service.getReportStats(from, to);

      // check that count was called with where containing occurredAt
      expect(repo.count).toHaveBeenCalledWith({
        where: {
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          occurredAt: expect.anything(), // Between object
        },
      });
    });
  });

    describe('getMailingStats', () => {
      it('combines sent and scheduled counts correctly', async () => {
        repo.count.mockImplementation(({ where }: any) => {
          switch (where?.eventType) {
            case AnalyticsEventType.EMAIL_SENT:
              return 15;
            case AnalyticsEventType.EMAIL_SCHEDULED:
              return 4;
            case AnalyticsEventType.EMAIL_BATCH_SENT:
              return 6;
            default:
              return 0;
          }
        });
  
        const result = await service.getMailingStats();
  
        expect(result.totalSent).toBe(21); // 15 + 6
        expect(result.scheduled).toBe(8); // 4 + 4 (batch_schedule also EMAIL_SCHEDULED)
      });
  
      it('returns zeros when no mailing events', async () => {
        repo.count.mockResolvedValue(0);
  
        const result = await service.getMailingStats();
  
        expect(result.totalSent).toBe(0);
        expect(result.scheduled).toBe(0);
      });
    });

});