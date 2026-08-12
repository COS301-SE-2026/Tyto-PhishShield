 /*
 * @file Unit tests for AnalyticsController.
 *
 * Covers RabbitMQ event handlers, REST endpoints,
 * and service-to-service TCP message patterns.
 * (also has a few tests I added just to be safe)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventType } from './entities/analytics-event.entity';

const mockAnalyticsService = {
  recordEvent: jest.fn(),
  getOverview: jest.fn(),
  getReportStats: jest.fn(),
  getMailingStats: jest.fn(),
  getTimeSeries: jest.fn(),
  getLeaderboard: jest.fn(),
  getUserStats: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<typeof mockAnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // console.log('cleared mocks'); // i keep forgetting to remove this
  });

   describe('RabbitMQ event handlers', () => {
    describe('onReportSubmitted', () => {
      it('records a REPORT_SUBMITTED event with auth0Id and email', async () => {
        const payload = {
          auth0Id: 'auth0|123',
          email: 'test@example.com',
          reportId: 'rep1',
        };

        await controller.onReportSubmitted(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: payload.auth0Id,
          email: payload.email,
          payload: payload as any,
        });
      });

      it('works when email is missing', async () => {
        // not sure why this would happen but just in case
        const payload = {
          auth0Id: 'auth0|456',
          reportId: 'rep2',
        };

        await controller.onReportSubmitted(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: payload.auth0Id,
          email: undefined,
          payload: payload as any,
        });
      });
    });

        describe('onXpGiven', () => {
          it('records XP_GIVEN and REPORT_CONFIRMED when reason contains "phishing"', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
              reason: 'Valid phishing report',
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(2);
            expect(service.recordEvent).toHaveBeenNthCalledWith(1, {
              eventType: AnalyticsEventType.XP_GIVEN,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
            expect(service.recordEvent).toHaveBeenNthCalledWith(2, {
              eventType: AnalyticsEventType.REPORT_CONFIRMED,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
          });
    
          it('records only XP_GIVEN when reason does not include "phishing"', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
              reason: 'Passed education assignment',
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(1);
            expect(service.recordEvent).toHaveBeenCalledWith({
              eventType: AnalyticsEventType.XP_GIVEN,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
          });
    
          it('records only XP_GIVEN when reason is missing', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(1);
          });
        });

            describe('onEducationAssigned', () => {
      it('records EDUCATION_ASSIGNED and REPORT_FALSE_POSITIVE', async () => {
        const payload = {
          auth0Id: 'auth0|123',
          email: 'test@example.com',
          reportId: 'rep1',
        };

        await controller.onEducationAssigned(payload);

        expect(service.recordEvent).toHaveBeenCalledTimes(2);
        expect(service.recordEvent).toHaveBeenNthCalledWith(1, {
          eventType: AnalyticsEventType.EDUCATION_ASSIGNED,
          auth0Id: payload.auth0Id,
          email: payload.email,
          payload: payload as any,
        });
        expect(service.recordEvent).toHaveBeenNthCalledWith(2, {
          eventType: AnalyticsEventType.REPORT_FALSE_POSITIVE,
          auth0Id: payload.auth0Id,
          email: payload.email,
          payload: payload as any,
        });
      });
    });

        describe('onEmailSent', () => {
      it('records EMAIL_SENT event', async () => {
        const payload = {
          referenceNumber: 'PHISH-123',
          recipient: 'test@example.com',
          scheduledAt: new Date().toISOString(),
        };

        await controller.onEmailSent(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.EMAIL_SENT,
          payload: payload as any,
        });
      });
    });

    describe('onEmailScheduled', () => {
      it('records EMAIL_SCHEDULED event', async () => {
        const payload = {
          referenceNumber: 'PHISH-123',
          recipient: 'test@example.com',
          scheduledAt: new Date().toISOString(),
        };

        await controller.onEmailScheduled(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.EMAIL_SCHEDULED,
          payload: payload as any,
        });
      });
    });

    describe('onBatchEmailSent', () => {
      it('records EMAIL_BATCH_SENT with count only', async () => {
        const payload = {
          entries: [
            { referenceNumber: 'PHISH-1', recipient: 'a@example.com' },
            { referenceNumber: 'PHISH-2', recipient: 'b@example.com' },
            { referenceNumber: 'PHISH-3', recipient: 'c@example.com' },
          ],
        };

        await controller.onBatchEmailSent(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
          payload: { count: 3 },
        });
      });

      it('handles missing entries by sending count 0', async () => {
        const payload = {};

        await controller.onBatchEmailSent(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
          payload: { count: 0 },
        });
      });
    });

    describe('onBatchEmailScheduled', () => {
      it('records EMAIL_SCHEDULED with batch flag and count', async () => {
        const payload = {
          entries: [
            { referenceNumber: 'PHISH-1', recipient: 'a@example.com' },
            { referenceNumber: 'PHISH-2', recipient: 'b@example.com' },
          ],
        };

        await controller.onBatchEmailScheduled(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.EMAIL_SCHEDULED,
          payload: { count: 2, batch: true },
        });
      });
    });

    });

      describe('HTTP endpoints', () => {
    it('getOverview calls service.getOverview and returns its result', async () => {
      const overview = {
        totalEmailsSent: 10,
        totalReports: 5,
        confirmedPhishing: 2,
        falsePositives: 3,
        totalXpGiven: 50,
        educationAssigned: 3,
        educationCompleted: 1,
      };
      service.getOverview.mockResolvedValue(overview as any);

      const result = await controller.getOverview();

      expect(service.getOverview).toHaveBeenCalled();
      expect(result).toEqual(overview);
    });

    it('getReportStats forwards optional from/to dates', async () => {
      const reportStats = {
        submitted: 5,
        confirmed: 2,
        falsePositive: 3,
        detectionRate: 40,
      };
      service.getReportStats.mockResolvedValue(reportStats as any);

      const result = await controller.getReportStats('2026-08-01', '2026-08-10');

      expect(service.getReportStats).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-10',
      );
      expect(result).toEqual(reportStats);
    });

    it('getReportStats handles missing dates', async () => {
      await controller.getReportStats();

      expect(service.getReportStats).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getMailingStats forwards optional from/to dates', async () => {
      const mailingStats = { totalSent: 20, scheduled: 5 };
      service.getMailingStats.mockResolvedValue(mailingStats as any);

      const result = await controller.getMailingStats('2026-08-01', '2026-08-10');

      expect(service.getMailingStats).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-10',
      );
      expect(result).toEqual(mailingStats);
    });

    it('getTimeSeries requires from and to and returns service result', async () => {
      const timeSeries = [
        { date: '2026-08-01', reports: 1, emailsSent: 2, xpGiven: 10 },
      ];
      service.getTimeSeries.mockResolvedValue(timeSeries as any);

      const result = await controller.getTimeSeries('2026-08-01', '2026-08-02');

      expect(service.getTimeSeries).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-02',
      );
      expect(result).toEqual(timeSeries);
    });

    it('getLeaderboard parses limit and passes to service', async () => {
      const leaderboard = [
        { auth0Id: 'user1', email: 'u1@example.com', totalXp: 100, reportCount: 5 },
      ];
      service.getLeaderboard.mockResolvedValue(leaderboard as any);

      const result = await controller.getLeaderboard('5');

      expect(service.getLeaderboard).toHaveBeenCalledWith(5);
      expect(result).toEqual(leaderboard);
    });

    it('getLeaderboard uses default 10 when limit missing', async () => {
      await controller.getLeaderboard();

      expect(service.getLeaderboard).toHaveBeenCalledWith(10);
    });

    it('getUserStats passes auth0Id and returns service result', async () => {
      const userStats = {
        reports: 2,
        confirmed: 1,
        falsePositive: 1,
        totalXp: 20,
        educationCompleted: 1,
      };
      service.getUserStats.mockResolvedValue(userStats as any);

      const result = await controller.getUserStats('auth0|123');

      expect(service.getUserStats).toHaveBeenCalledWith('auth0|123');
      expect(result).toEqual(userStats);
    });
  });
  

});