/**
 * @file Unit tests for AnalyticsService.
 *
 * Covers event recording, overview stats, report/mailing stats,
 * per-user stats, time series aggregation, and the leaderboard.
 * Also tests user/campaign/click/send synchronization and new aggregate endpoints.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from './entities/analytics-event.entity';
import { AnalyticsUser } from './entities/analytics-user.entity';
import { Campaign } from './entities/campaign.entity';
import { ClickEvent } from './entities/click-event.entity';
import { SimulationSend } from './entities/simulation-send.entity';
import { Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

// simple mock repos – all methods are jest.fn()
const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

const mockUserRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockCampaignRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockClickRepo = {
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

const mockSendRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};
// make sure about the tests this time. These should be unit and the other integration.
describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repo: jest.Mocked<typeof mockRepo>;
  let userRepo: jest.Mocked<typeof mockUserRepo>;
  let campaignRepo: jest.Mocked<typeof mockCampaignRepo>;
  let clickRepo: jest.Mocked<typeof mockClickRepo>;
  let sendRepo: jest.Mocked<typeof mockSendRepo>;
// make sure everything is mocked and check with backedn that they are fine with these tests.
  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
        { provide: getRepositoryToken(AnalyticsUser), useValue: mockUserRepo },
        { provide: getRepositoryToken(Campaign), useValue: mockCampaignRepo },
        { provide: getRepositoryToken(ClickEvent), useValue: mockClickRepo },
        { provide: getRepositoryToken(SimulationSend), useValue: mockSendRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repo = module.get(getRepositoryToken(AnalyticsEvent));
    userRepo = module.get(getRepositoryToken(AnalyticsUser));
    campaignRepo = module.get(getRepositoryToken(Campaign));
    clickRepo = module.get(getRepositoryToken(ClickEvent));
    sendRepo = module.get(getRepositoryToken(SimulationSend));
  });

  describe('recordEvent', () => {
    it('creates and saves an evnt with the given input', async () => {
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

    it('returns zero totals whn no events exist', async () => {
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
// this is important for all the filters to be working in tandem with each other.
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
// yet again make sure with darius for this one righ here.
  describe('getMailingStats', () => {
    it('combines sent and scheuled counts correctly', async () => {
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
// ok all this should test is the getUserStats function and make sure it works as intended.
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

    it('returns agregated user stats including total XP', async () => {
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
    it('groups events by day and agregates counts', async () => {
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
    it('returns top users by XP with report cont', async () => {
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
//IMPORTANT 
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

  describe('upsertUser', () => {
    it('creates a new user if not fund', async () => {
      const user = {
        auth0Id: 'auth0|new',
        email: 'new@example.com',
        name: 'New User',
        department: 'Finance',
        role: 'user',
      };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(user as any);
      userRepo.save.mockResolvedValue(user as any);

      await service.upsertUser(user);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { auth0Id: user.auth0Id },
      });
      expect(userRepo.create).toHaveBeenCalledWith(user);
      expect(userRepo.save).toHaveBeenCalled();
    });
// for per user stats
    it('updates existing user', async () => {
      const existing = {
        auth0Id: 'auth0|1',
        email: 'old@example.com',
        name: 'Old Name',
        department: 'IT',
        role: 'user',
      };
      const update = {
        auth0Id: 'auth0|1',
        email: 'new@example.com',
        name: 'New Name',
        department: 'Finance',
        role: 'analyst',
      };
      userRepo.findOne.mockResolvedValue(existing as any);
      userRepo.save.mockResolvedValue({ ...existing, ...update } as any);

      await service.upsertUser(update);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { auth0Id: update.auth0Id },
      });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });
// didnt work at first, but works now after some help debuggin, check again to make sure here.
    it('ignores duplicate key error (23505)', async () => {
      const user = {
        auth0Id: 'auth0|dup',
        email: 'dup@example.com',
      };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(user as any);
      const queryError = new QueryFailedError('', [], { code: '23505' } as any);
      userRepo.save.mockRejectedValue(queryError);

      await expect(service.upsertUser(user)).resolves.toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('calls repo.delete with auth0Id', async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 } as any);
      await service.deleteUser('auth0|123');
      expect(userRepo.delete).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
    });
  });

  describe('upsertCampaign', () => {
    it('creates a new campaign if not found', async () => {
      const campaign = {
        id: 'wave-1',
        name: 'Test Wave',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(),
      };
      campaignRepo.findOne.mockResolvedValue(null);
      campaignRepo.create.mockReturnValue(campaign as any);
      campaignRepo.save.mockResolvedValue(campaign as any);

      await service.upsertCampaign(campaign);

      expect(campaignRepo.findOne).toHaveBeenCalledWith({
        where: { id: campaign.id },
      });
      expect(campaignRepo.save).toHaveBeenCalled();
    });

    it('updates existing campaign', async () => {
      const existing = {
        id: 'wave-1',
        name: 'Old',
        status: 'active',
      };
      const update = {
        id: 'wave-1',
        name: 'New',
        status: 'completed',
      };
      campaignRepo.findOne.mockResolvedValue(existing as any);
      campaignRepo.save.mockResolvedValue({ ...existing, ...update } as any);

      await service.upsertCampaign(update);

      expect(campaignRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New' }),
      );
    });
  });
//this was also inconsistent at the start, but looks fine now.
  describe('recordSimulationSend', () => {
    it('creates new send if not existing', async () => {
      const input = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-ABC',
        auth0Id: 'auth0|1',
        campaignId: 'wave-1',
        sentAt: new Date(),
      };
      sendRepo.findOne.mockResolvedValue(null);
      sendRepo.create.mockReturnValue(input as any);
      sendRepo.save.mockResolvedValue(input as any);

      await service.recordSimulationSend(input);

      expect(sendRepo.findOne).toHaveBeenCalledWith({
        where: { emailId: input.emailId },
      });
      expect(sendRepo.create).toHaveBeenCalledWith(input);
    });

    it('updates existing send', async () => {
      const existing = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-ABC',
        auth0Id: 'auth0|1',
        campaignId: 'wave-1',
        sentAt: new Date(),
      };
      const update = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-ABC',
        auth0Id: 'auth0|2',
        campaignId: 'wave-2',
        sentAt: new Date(),
      };
      sendRepo.findOne.mockResolvedValue(existing as any);
      sendRepo.save.mockResolvedValue({ ...existing, ...update } as any);

      await service.recordSimulationSend(update);

      expect(sendRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ auth0Id: 'auth0|2' }),
      );
    });
  });
//TODO: add some more tests for recordClickFromEmailId and recordClickFromAuth0Id, including edge cases and error handling.
  describe('recordClickFromEmailId', () => {
    it('creates click event when send exists', async () => {
      const send = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-ABC',
        auth0Id: 'auth0|1',
        campaignId: 'wave-1',
      };
      sendRepo.findOne.mockResolvedValue(send as any);
      clickRepo.create.mockReturnValue({
        referenceNumber: send.referenceNumber,
        auth0Id: send.auth0Id,
        campaignId: send.campaignId,
      } as any);
      clickRepo.save.mockResolvedValue({} as any);

      await service.recordClickFromEmailId('email-123');

      expect(sendRepo.findOne).toHaveBeenCalledWith({
        where: { emailId: 'email-123' },
      });
      expect(clickRepo.create).toHaveBeenCalledWith({
        referenceNumber: 'PHISH-ABC',
        auth0Id: 'auth0|1',
        campaignId: 'wave-1',
      });
      expect(clickRepo.save).toHaveBeenCalled();
    });

    it('logs warning and does nohing when send not found', async () => {
      sendRepo.findOne.mockResolvedValue(null);
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {});

      await service.recordClickFromEmailId('unknown-email');

      expect(clickRepo.create).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('recordClickFromAuth0Id', () => {
    it('creates click event with placeholder refereceNumber', async () => {
      clickRepo.create.mockReturnValue({
        referenceNumber: 'unknown',
        auth0Id: 'auth0|1',
      } as any);
      clickRepo.save.mockResolvedValue({} as any);

      await service.recordClickFromAuth0Id('auth0|1');

      expect(clickRepo.create).toHaveBeenCalledWith({
        referenceNumber: 'unknown',
        auth0Id: 'auth0|1',
      });
      expect(clickRepo.save).toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('returns KPI structure with deltas', async () => {
      // Simplified: mock getPeriodStats and getAtRiskUsers
      jest
        .spyOn(service as any, 'getPeriodStats')
        .mockResolvedValueOnce({
          totalEmailsSent: 100,
          detectionRate: 20,
          clickRate: 5,
          atRiskUsers: 0,
          trainingCompletionRate: 50,
        })
        .mockResolvedValueOnce({
          totalEmailsSent: 80,
          detectionRate: 25,
          clickRate: 4,
          atRiskUsers: 0,
          trainingCompletionRate: 40,
        });

      jest
        .spyOn(service as any, 'getAtRiskUsers')
        .mockResolvedValueOnce([{ auth0Id: 'u1' }])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary(30);

      expect(result.detectionRate.value).toBe(20);
      expect(result.detectionRate.delta).toBeCloseTo(-20);
      expect(result.totalSimulations.value).toBe(100);
      expect(result.atRiskUsers.value).toBe(1);
      expect(result.trainingCompletion.value).toBe(50);
    });
  });

  describe('getDetectionRateOverTime', () => {
    it('returns daily buckets with rates', async () => {
      // Mock repo, sendRepo, clickRepo
      repo.find.mockResolvedValue([
        {
          occurredAt: new Date('2026-08-01T10:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },
        {
          occurredAt: new Date('2026-08-01T11:00:00Z'),
          eventType: AnalyticsEventType.REPORT_CONFIRMED,
        },
      ] as any);

      sendRepo.find.mockResolvedValue([
        { sentAt: new Date('2026-08-01T09:00:00Z') },
      ] as any);

      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date('2026-08-01T12:00:00Z') },
      ] as any);

      const result = await service.getDetectionRateOverTime(1); // 1 day

      const day = result.find((r) => r.date === '2026-08-01');
      expect(day).toBeDefined();
      expect(day.detectionRate).toBe(100);
      expect(day.clickRate).toBe(100);
    });
  });
//TODO: add tests for getByDepartment and getAtRiskUsers, including edge cases and error handling.
  describe('getByDepartment', () => {
    it('aggregates by department', async () => {
      userRepo.find.mockResolvedValue([
        { auth0Id: 'u1', department: 'Finance' },
        { auth0Id: 'u2', department: 'IT' },
      ] as any);

      repo.find.mockResolvedValue([
        {
          occurredAt: new Date(),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: 'u1',
        },
        {
          occurredAt: new Date(),
          eventType: AnalyticsEventType.REPORT_CONFIRMED,
          auth0Id: 'u1',
        },
      ] as any);

      sendRepo.find.mockResolvedValue([
        { sentAt: new Date(), auth0Id: 'u1' },
        { sentAt: new Date(), auth0Id: 'u2' },
      ] as any);

      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date(), auth0Id: 'u1' },
      ] as any);

      const result = await service.getByDepartment(30);

      const finance = result.find((r) => r.department === 'Finance');
      expect(finance).toBeDefined();
      expect(finance.detectionRate).toBe(100);
      expect(finance.clickRate).toBe(100);
    });
  });

  describe('getAtRiskUsers', () => {
    it('returns users above click threshold', async () => {
      sendRepo.find.mockResolvedValue([
        { sentAt: new Date(), auth0Id: 'u1' },
        { sentAt: new Date(), auth0Id: 'u2' },
      ] as any);

      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date(), auth0Id: 'u1' },
        { clickedAt: new Date(), auth0Id: 'u1' },
      ] as any);

      userRepo.find.mockResolvedValue([
        { auth0Id: 'u1', name: 'User One', department: 'Finance' },
        { auth0Id: 'u2', name: 'User Two', department: 'IT' },
      ] as any);

      const result = await service.getAtRiskUsers(30, 10);

      expect(result).toHaveLength(1);
      expect(result[0].auth0Id).toBe('u1');
      expect(result[0].clickRate).toBe(200);
      expect(result[0].riskLevel).toBe('high');
    });
  });
//TODO: add tests for getCampaigns, including edge cases and error handling.
  describe('getCampaigns', () => {
    it('returns campaigns ordered by startDate desc', async () => {
      campaignRepo.find.mockResolvedValue([
        { id: 'wave-1', status: 'active', startDate: new Date('2026-08-01') },
        { id: 'wave-2', status: 'active', startDate: new Date('2026-07-01') },
      ] as any);

      const result = await service.getCampaigns();

      expect(campaignRepo.find).toHaveBeenCalledWith({
        order: { startDate: 'DESC' },
      });
      expect(result[0].id).toBe('wave-1');
    });

    it('marks campaigns as completed if endDate passed', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      campaignRepo.find.mockResolvedValue([
        { id: 'wave-1', startDate: past, endDate: past, status: 'active' },
      ] as any);

      const result = await service.getCampaigns();

      expect(result[0].status).toBe('completed');
    });
  });
});
