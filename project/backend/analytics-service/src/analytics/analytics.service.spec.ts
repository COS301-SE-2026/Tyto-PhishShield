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

      await service.recordEvent(input);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledWith(created);
    });

    it('handles missing optional fields', async () => {
      const input = { eventType: AnalyticsEventType.XP_GIVEN };
      const created = { id: 'evt2', ...input };
      repo.create.mockReturnValue(created as any);
      repo.save.mockResolvedValue(created as any);

      await service.recordEvent(input);

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

  describe('getUserStats', () => {
    const auth0Id = 'auth0|123';

    beforeEach(() => {
      repo.count.mockImplementation(({ where }: any) => {
        switch (where?.eventType) {
          case AnalyticsEventType.REPORT_SUBMITTED:
            return 5;
          case AnalyticsEventType.REPORT_CONFIRMED:
            return 2;
          case AnalyticsEventType.REPORT_FALSE_POSITIVE:
            return 3;
          case AnalyticsEventType.EDUCATION_COMPLETED:
            return 1;
          default:
            return 0;
        }
      });

      repo.find.mockResolvedValue([
        { payload: { amount: 50 } },
        { payload: { amount: 75 } },
      ] as any);
    });

    it('returns aggregated user stats including total XP', async () => {
      const result = await service.getUserStats(auth0Id);

      expect(result.reports).toBe(5);
      expect(result.confirmed).toBe(2);
      expect(result.falsePositive).toBe(3);
      expect(result.educationCompleted).toBe(1);
      expect(result.totalXp).toBe(125); // 50 + 75
      expect(result.securityScore).toBe(33); // xpScore = min(100, 125/500*100) = 25, detectionScore = 2/5*100 = 40; score = round(0.5*25 + 0.5*40) = 33
    });

    it('handles user with no XP events', async () => {
      repo.find.mockResolvedValue([] as any);
      const result = await service.getUserStats(auth0Id);
      expect(result.totalXp).toBe(0);
      expect(result.securityScore).toBe(20);
    });

    it('gives a neutral detection score when the user has no reports yet', async () => {
      repo.count.mockResolvedValue(0);
      repo.find.mockResolvedValue([{ payload: { amount: 200 } }] as any);
      const result = await service.getUserStats(auth0Id);
      expect(result.securityScore).toBe(45);
    });

    it('caps the XP component at 100 once past the max-score threshold', async () => {
      repo.find.mockResolvedValue([{ payload: { amount: 5000 } }] as any);
      const result = await service.getUserStats(auth0Id);
      expect(result.securityScore).toBe(70);
    });
  });

  describe('getTimeSeries', () => {
    it('groups events by day and aggregates counts', async () => {
      const from = '2026-08-01';
      const to = '2026-08-02';
      const events = [
        {
          occurredAt: new Date('2026-08-01T10:00:00Z'),
          eventType: AnalyticsEventType.EMAIL_SENT,
        },
        {
          occurredAt: new Date('2026-08-01T11:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },
        {
          occurredAt: new Date('2026-08-01T12:00:00Z'),
          eventType: AnalyticsEventType.XP_GIVEN,
          payload: { amount: 10 },
        },
        {
          occurredAt: new Date('2026-08-02T09:00:00Z'),
          eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
        },
        {
          occurredAt: new Date('2026-08-02T10:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },
      ];

      repo.find.mockResolvedValue(events as any);

      const result = await service.getTimeSeries(from, to);

      expect(result).toEqual([
        { date: '2026-08-01', reports: 1, emailsSent: 1, xpGiven: 10 },
        { date: '2026-08-02', reports: 1, emailsSent: 1, xpGiven: 0 },
      ]);
    });

    it('returns empty array when no events in range', async () => {
      repo.find.mockResolvedValue([] as any);

      const result = await service.getTimeSeries('2026-08-01', '2026-08-02');

      expect(result).toEqual([]);
    });
  });

  describe('getLeaderboard', () => {
    it('returns top users by XP with report count', async () => {
      const xpEvents = [
        { auth0Id: 'user1', email: 'u1@example.com', payload: { amount: 100 } },
        { auth0Id: 'user2', email: 'u2@example.com', payload: { amount: 50 } },
        { auth0Id: 'user1', email: 'u1@example.com', payload: { amount: 30 } },
      ];
      const confirmedReports = [
        { auth0Id: 'user1' },
        { auth0Id: 'user1' },
        { auth0Id: 'user2' },
      ];

      repo.find
        .mockResolvedValueOnce(xpEvents as any)
        .mockResolvedValueOnce(confirmedReports as any);

      const result = await service.getLeaderboard(2);

      expect(result).toEqual([
        {
          auth0Id: 'user1',
          email: 'u1@example.com',
          totalXp: 130,
          reportCount: 2,
        },
        {
          auth0Id: 'user2',
          email: 'u2@example.com',
          totalXp: 50,
          reportCount: 1,
        },
      ]);
    });

    it('skips entries without auth0Id', async () => {
      const xpEvents = [
        { auth0Id: null, payload: { amount: 100 } }, // should be ignored
        { auth0Id: 'user1', payload: { amount: 10 } },
      ];
      const confirmedReports = [{ auth0Id: 'user1' }];

      repo.find
        .mockResolvedValueOnce(xpEvents as any)
        .mockResolvedValueOnce(confirmedReports as any);

      const result = await service.getLeaderboard(10);

      expect(result).toHaveLength(1);
      expect(result[0].auth0Id).toBe('user1');
      expect(result[0].totalXp).toBe(10);
    });

    it('defaults limit to 10 and sorts by totalXp desc', async () => {
      const xpEvents = Array.from({ length: 12 }, (_, i) => ({
        auth0Id: `user${i}`,
        payload: { amount: i + 1 },
      }));
      repo.find
        .mockResolvedValueOnce(xpEvents as any)
        .mockResolvedValueOnce([] as any);

      const result = await service.getLeaderboard();

      expect(result).toHaveLength(10);
      expect(result[0].totalXp).toBe(12); // highest amount last in array? see note below
      // Actually the sort should put highest first, so first should be user11 (amount 12)
      expect(result[0].auth0Id).toBe('user11');
    });
  });
});
