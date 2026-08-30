/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { EmailStatusController } from './email-status.controller';
import { EmailStatusService } from './email-status.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  EmailStatusEntity,
  EmailStatusEnum,
} from './entities/email-status.entity';

describe('EmailStatusController', () => {
  let controller: EmailStatusController;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockEmailStatusService = {
    createStatus: jest.fn(),
    getStatus: jest.fn(),
    deleteStatus: jest.fn(),
  };

  const mockAnalyticsService = {
    recordClickFromEmailId: jest.fn(),
  };

  const mockEmailStatus = {
    emailId: 'test-email-id',
    messageId: 'test-message-id',
    status: EmailStatusEnum.SENT,
    webhookEventId: 'test-webhook-event-id',
    occurredAt: new Date(),
  } as EmailStatusEntity;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailStatusController],
      providers: [
        {
          provide: EmailStatusService,
          useValue: mockEmailStatusService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<EmailStatusController>(EmailStatusController);
    analyticsService = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createStatus', () => {
    it('should call service.createStatus', async () => {
      mockEmailStatusService.createStatus.mockResolvedValue(mockEmailStatus);

      const result = await controller.createStatus(mockEmailStatus);
      expect(mockEmailStatusService.createStatus).toHaveBeenCalledWith(
        mockEmailStatus,
      );
      expect(result).toEqual(mockEmailStatus);
    });

    it('should record click when status is CLICKED', async () => {
      const clickedStatus = {
        ...mockEmailStatus,
        status: EmailStatusEnum.CLICKED,
      };

      mockEmailStatusService.createStatus.mockResolvedValue(clickedStatus);
      analyticsService.recordClickFromEmailId.mockResolvedValue(undefined);

      await controller.createStatus(clickedStatus);

      expect(analyticsService.recordClickFromEmailId).toHaveBeenCalledWith(
        clickedStatus.emailId,
      );
    });

    it('should NOT record click for non-click statuses', async () => {
      mockEmailStatusService.createStatus.mockResolvedValue(mockEmailStatus);

      await controller.createStatus(mockEmailStatus);

      expect(analyticsService.recordClickFromEmailId).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should call service.getStatus and return an array of statuses', async () => {
      const emailId = 'test-email-id';
      mockEmailStatusService.getStatus.mockResolvedValue([mockEmailStatus]);

      const result = await controller.getStatus(emailId);
      expect(mockEmailStatusService.getStatus).toHaveBeenCalledWith(emailId);
      expect(result).toEqual([mockEmailStatus]);
    });
  });

  describe('deleteStatus', () => {
    it('should call service.deleteStatus and return the deleted entity', async () => {
      const emailId = 'test-email-id';
      mockEmailStatusService.deleteStatus.mockResolvedValue(mockEmailStatus);

      const result = await controller.deleteStatus(emailId);
      expect(mockEmailStatusService.deleteStatus).toHaveBeenCalledWith(emailId);
      expect(result).toEqual(mockEmailStatus);
    });
  });
});
