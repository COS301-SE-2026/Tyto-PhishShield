import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BatchEmailController } from './batch-email.controller';
import { ProxyService } from '../../proxy/proxy.service';
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';
import { EmailDifficulty, SendBatchRandomDto, } from '../dto/send-batch-random.dto';

const MAILING_SERVICE_URL = 'http://localhost:3003';

const mockProxyService = {
  forward: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultVal?: string) => {
    if (key === 'MAILING_SERVICE_URL') return MAILING_SERVICE_URL;
    return defaultVal;
  }),
};

describe('BatchEmailController', () => {
  let controller: BatchEmailController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchEmailController],
      providers: [
        { provide: ProxyService, useValue: mockProxyService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<BatchEmailController>(BatchEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendBatchWithReference', () => {
    const referenceNumber = 'PHISH-001';
    const body: SendBatchEmailDto = {
      recipients: ['a@example.com', 'b@example.com'],
    };

    it('should call proxy.forward with the correct URL, method and body', () => {
      mockProxyService.forward.mockReturnValue({
        success: true,
        message: 'sent',
      });

      controller.sendBatchWithReference(referenceNumber, body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/batch-emails/${referenceNumber}/send-batch-with-reference`,
        method: 'POST',
        data: body,
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const response = { success: true, message: 'Test' };
      mockProxyService.forward.mockReturnValue(response);

      const result = controller.sendBatchWithReference(referenceNumber, body);

      expect(result).toBe(response);
    });

    it('should include the referenceNumber from the route param in the forwarded URL', () => {
      controller.sendBatchWithReference('PHISH-001', body);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.url).toContain('PHISH-001');
    });
  });

  describe('sendBatchRandomSameEmail', () => {
    const body: SendBatchRandomDto = {
      recipients: ['a@example.com', 'b@example.com'],
      difficulty: EmailDifficulty.MEDIUM,
      scheduledFrom: new Date('2026-06-24T10:00:00.000Z'),
      scheduledTo: new Date('2026-06-24T12:00:00.000Z'),
      randomisedTimes: true,
    };

    it('should call proxy.forward with the correct URL, method and body', () => {
      mockProxyService.forward.mockReturnValue({
        success: true,
        message: 'scheduled',
      });

      controller.sendBatchRandomSameEmail(body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/batch-emails/send-batch-random-same-email`,
        method: 'POST',
        data: body,
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const response = { success: true, message: 'Test' };
      mockProxyService.forward.mockReturnValue(response);

      const result = controller.sendBatchRandomSameEmail(body);

      expect(result).toBe(response);
    });

    it('should forward the full body unchanged', () => {
      controller.sendBatchRandomSameEmail(body);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.data).toBe(body);
    });
  });

  describe('sendBatchRandomDifferentEmail', () => {
    const body: SendBatchRandomDto = {
      recipients: ['a@example.com', 'b@example.com', 'c@example.com'],
      difficulty: EmailDifficulty.HARD,
      scheduledFrom: new Date('2026-06-24T08:00:00.000Z'),
      scheduledTo: new Date('2026-06-24T09:00:00.000Z'),
      randomisedTimes: false,
    };

    it('should call proxy.forward with the correct URL, method and body', () => {
      mockProxyService.forward.mockReturnValue({
        success: true,
        message: 'scheduled',
      });

      controller.sendBatchRandomDifferentEmail(body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/batch-emails/send-batch-random-different-email`,
        method: 'POST',
        data: body,
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const response = { success: true, message: 'Test' };
      mockProxyService.forward.mockReturnValue(response);

      const result = controller.sendBatchRandomDifferentEmail(body);

      expect(result).toBe(response);
    });

    it('should forward the full body unchanged', () => {
      controller.sendBatchRandomDifferentEmail(body);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.data).toBe(body);
    });
  });
});