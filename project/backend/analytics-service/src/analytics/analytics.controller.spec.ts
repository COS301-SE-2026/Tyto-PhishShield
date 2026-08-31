/**
 * @file Unit tests for AnalyticsController.
 *
 * Covers RabbitMQ event handlers, REST endpoints,
 * and service-to-service TCP message patterns.
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
  recordSimulationSend: jest.fn(),
  recordClickFromAuth0Id: jest.fn(),
  upsertUser: jest.fn(),
  deleteUser: jest.fn(),
  upsertCampaign: jest.fn(),
  deleteCampaign: jest.fn(),
  getSummary: jest.fn(),
  getDetectionRateOverTime: jest.fn(),
  getByDepartment: jest.fn(),
  getAtRiskUsers: jest.fn(),
  getCampaigns: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<typeof mockAnalyticsService>;

  beforeEach(async () => {
    jest.clearAllMocks();

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
  });

  // ===================== RabbitMQ event handlers =====================

  describe('onReportSubmitted', () => {
    it('records REPORT_SUBMITTED with auth0Id and email', async () => {
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

    it('records without email if missing', async () => {
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
    it('records XP_GIVEN and REPORT_CONFIRMED when reason includes "phishing"', async () => {
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

    it('calls recordClickFromAuth0Id when reason includes "compromised"', async () => {
      const payload = {
        auth0Id: 'auth0|123',
        amount: -40,
        reason: 'compromised',
      };

      await controller.onXpGiven(payload);

      expect(service.recordClickFromAuth0Id).toHaveBeenCalledWith('auth0|123');
      expect(service.recordEvent).toHaveBeenCalledTimes(1);
    });

    it('does not call recordClickFromAuth0Id for normal xp reasons', async () => {
      const payload = {
        auth0Id: 'auth0|123',
        amount: 10,
        reason: 'Passed education assignment',
      };

      await controller.onXpGiven(payload);

      expect(service.recordClickFromAuth0Id).not.toHaveBeenCalled();
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
    it('records EMAIL_SENT and SimulationSend when emailId present', async () => {
      const payload = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-123',
        recipient: 'test@example.com',
        scheduledAt: new Date().toISOString(),
        auth0Id: 'auth0|123',
      };

      await controller.onEmailSent(payload);

      expect(service.recordEvent).toHaveBeenCalledWith({
        eventType: AnalyticsEventType.EMAIL_SENT,
        payload: payload as any,
      });
      expect(service.recordSimulationSend).toHaveBeenCalledWith({
        emailId: 'email-123',
        referenceNumber: 'PHISH-123',
        auth0Id: 'auth0|123',
        campaignId: undefined,
        sentAt: expect.any(Date),
      });
    });

    it('does not call recordSimulationSend if emailId missing', async () => {
      const payload = {
        referenceNumber: 'PHISH-123',
        recipient: 'test@example.com',
        scheduledAt: new Date().toISOString(),
      };

      await controller.onEmailSent(payload);

      expect(service.recordSimulationSend).not.toHaveBeenCalled();
    });
  });

  describe('onEmailScheduled', () => {
    it('records EMAIL_SCHEDULED and SimulationSend when emailId present', async () => {
      const payload = {
        emailId: 'email-123',
        referenceNumber: 'PHISH-123',
        recipient: 'test@example.com',
        scheduledAt: new Date().toISOString(),
        auth0Id: 'auth0|123',
      };

      await controller.onEmailScheduled(payload);

      expect(service.recordEvent).toHaveBeenCalledWith({
        eventType: AnalyticsEventType.EMAIL_SCHEDULED,
        payload: payload as any,
      });
      expect(service.recordSimulationSend).toHaveBeenCalled();
    });

    it('does not call recordSimulationSend if emailId missing', async () => {
      const payload = {
        referenceNumber: 'PHISH-123',
        recipient: 'test@example.com',
        scheduledAt: new Date().toISOString(),
      };

      await controller.onEmailScheduled(payload);

      expect(service.recordSimulationSend).not.toHaveBeenCalled();
    });
  });

  describe('onBatchEmailSent', () => {
    it('records batch count and SimulationSend for each entry with emailId', async () => {
      const payload = {
        entries: [
          {
            referenceNumber: 'PHISH-1',
            recipient: 'a@example.com',
            scheduledAt: new Date().toISOString(),
            emailId: 'email-1',
            auth0Id: 'auth0|1',
            waveId: 'wave-1',
          },
          {
            referenceNumber: 'PHISH-2',
            recipient: 'b@example.com',
            scheduledAt: new Date().toISOString(),
            emailId: 'email-2',
            auth0Id: 'auth0|2',
            waveId: 'wave-1',
          },
        ],
      };

      await controller.onBatchEmailSent(payload);

      expect(service.recordEvent).toHaveBeenCalledWith({
        eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
        payload: { count: 2 },
      });
      expect(service.recordSimulationSend).toHaveBeenCalledTimes(2);
      expect(service.recordSimulationSend).toHaveBeenNthCalledWith(1, {
        emailId: 'email-1',
        referenceNumber: 'PHISH-1',
        auth0Id: 'auth0|1',
        campaignId: 'wave-1',
        sentAt: expect.any(Date),
      });
    });

    it('does not call recordSimulationSend if entries missing emailId', async () => {
      const payload = {
        entries: [
          {
            referenceNumber: 'PHISH-1',
            recipient: 'a@example.com',
            scheduledAt: new Date().toISOString(),
          },
          {
            referenceNumber: 'PHISH-2',
            recipient: 'b@example.com',
            scheduledAt: new Date().toISOString(),
          },
        ],
      };

      await controller.onBatchEmailSent(payload);

      expect(service.recordSimulationSend).not.toHaveBeenCalled();
    });
  });

  describe('onBatchEmailScheduled', () => {
    it('records batch schedule and SimulationSend for entries with emailId', async () => {
      const payload = {
        entries: [
          {
            referenceNumber: 'PHISH-1',
            recipient: 'a@example.com',
            scheduledAt: new Date().toISOString(),
            emailId: 'email-1',
            auth0Id: 'auth0|1',
            waveId: 'wave-1',
          },
        ],
      };

      await controller.onBatchEmailScheduled(payload);

      expect(service.recordEvent).toHaveBeenCalledWith({
        eventType: AnalyticsEventType.EMAIL_SCHEDULED,
        payload: { count: 1, batch: true },
      });
      expect(service.recordSimulationSend).toHaveBeenCalled();
    });
  });


  describe('onUserCreated / Updated / Deleted', () => {
    it('upserts user on created', async () => {
      const payload = {
        auth0Id: 'auth0|1',
        email: 'test@example.com',
        name: 'Test',
        department: 'Finance',
        role: 'user',
      };
      await controller.onUserCreated(payload);
      expect(service.upsertUser).toHaveBeenCalledWith(payload);
    });

    it('upserts user on updated', async () => {
      const payload = {
        auth0Id: 'auth0|1',
        email: 'test@example.com',
        name: 'Test',
        department: 'Finance',
        role: 'user',
      };
      await controller.onUserUpdated(payload);
      expect(service.upsertUser).toHaveBeenCalledWith(payload);
    });

    it('deletes user on deleted', async () => {
      const payload = { auth0Id: 'auth0|1' };
      await controller.onUserDeleted(payload);
      expect(service.deleteUser).toHaveBeenCalledWith('auth0|1');
    });
  });

  describe('onWaveCreate / onWaveDelete', () => {
    const wavePayload = {
      waveId: 'wave-1',
      waveName: 'Wave 1',
      scheduledFrom: '2026-08-01T00:00:00Z',
      scheduledTo: '2026-08-10T00:00:00Z',
      sameEmail: true,
      randomisedTimes: false,
      numberOfRecipients: 2,
    };

    it('upserts campaign on wave.create', async () => {
      await controller.onWaveCreate(wavePayload);

      expect(service.upsertCampaign).toHaveBeenCalledWith({
        id: 'wave-1',
        name: 'Wave 1',
        status: 'active',
        targetDepartments: undefined,
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-10T00:00:00Z'),
        createdBy: undefined,
      });
    });

    it('deletes campaign on wave.delete', async () => {
      await controller.onWaveDelete({ waveId: 'wave-1' });

      expect(service.deleteCampaign).toHaveBeenCalledWith('wave-1');
    });
  });

  // ===================== HTTP endpoints =====================

  describe('new HTTP endpoints', () => {
    it('getSummary returns service result with parsed period', async () => {
      service.getSummary.mockResolvedValue({
        detectionRate: { value: 10 },
      } as any);
      const result = await controller.getSummary('7d');
      expect(service.getSummary).toHaveBeenCalledWith(7);
      expect(result).toEqual({ detectionRate: { value: 10 } });
    });

    it('getDetectionRateOverTime returns service result with parsed period', async () => {
      service.getDetectionRateOverTime.mockResolvedValue([] as any);
      await controller.getDetectionRateOverTime('30d');
      expect(service.getDetectionRateOverTime).toHaveBeenCalledWith(30);
    });

    it('getByDepartment returns service result', async () => {
      service.getByDepartment.mockResolvedValue([] as any);
      await controller.getByDepartment('7d');
      expect(service.getByDepartment).toHaveBeenCalledWith(7);
    });

    it('getAtRiskUsers parses limit and period', async () => {
      service.getAtRiskUsers.mockResolvedValue([] as any);
      await controller.getAtRiskUsers('7d', '5');
      expect(service.getAtRiskUsers).toHaveBeenCalledWith(7, 5);
    });

    it('getCampaigns calls service', async () => {
      service.getCampaigns.mockResolvedValue([] as any);
      await controller.getCampaigns();
      expect(service.getCampaigns).toHaveBeenCalled();
    });
  });

  // ===================== TCP message patterns =====================

  describe('TCP message patterns', () => {
    it('getUserStatsTcp forwards auth0Id to service', async () => {
      service.getUserStats.mockResolvedValue({ totalXp: 10 } as any);
      const result = await controller.getUserStatsTcp('auth0|123');
      expect(service.getUserStats).toHaveBeenCalledWith('auth0|123');
      expect(result).toEqual({ totalXp: 10 });
    });

    it('getOverviewTcp calls service.getOverview', async () => {
      service.getOverview.mockResolvedValue({ totalEmailsSent: 1 } as any);
      const result = await controller.getOverviewTcp();
      expect(service.getOverview).toHaveBeenCalled();
      expect(result).toEqual({ totalEmailsSent: 1 });
    });
  });
});
