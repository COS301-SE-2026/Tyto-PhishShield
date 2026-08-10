/**
 * Service: api-gateway
 *
 * Unit tests for the api-gateway BatchEmailController.
 * Verifies that each endpoint correctly forwards requests to the mailing-service
 * URL via ProxyService and returns the proxy response unchanged.
 *
 * Test suites:
 * - {@link sendBatchWithReference} - Verifies the reference number and recipients body are forwarded correctly.
 * - {@link sendBatchRandomSameEmail} - Verifies the full body is forwarded to the same-email random batch endpoint.
 * - {@link sendBatchRandomDifferentEmail} - Verifies the full body is forwarded to the different-email random batch endpoint.
 */

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
      auth0Id: ['auth0|example1', 'auth0|example2'],
    };

    it('should forwards a POST request to /batch-emails/:referenceNumber/send-batch-with-reference', () => {
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

    it('should correctly return what proxy.forward returns for POST request to /batch-emails/:referenceNumber/send-batch-with-reference', () => {
      const response = { success: true, message: 'Test' };
      mockProxyService.forward.mockReturnValue(response);

      const result = controller.sendBatchWithReference(referenceNumber, body);

      expect(result).toBe(response);
    });

    it('should include the referenceNumber in the forwarded URL', () => {
      controller.sendBatchWithReference('PHISH-001', body);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.url).toContain('PHISH-001');
    });
  });

  describe('sendBatchRandomSameEmail', () => {
    const body: SendBatchRandomDto = {
      auth0Id: ['auth0|example1', 'auth0|example2'],
      difficulty: EmailDifficulty.MEDIUM,
      scheduledFrom: new Date('2026-06-24T10:00:00.000Z'),
      scheduledTo: new Date('2026-06-24T12:00:00.000Z'),
      randomisedTimes: true,
    };

    it('should forwards a POST request to /batch-emails/send-batch-random-same-email', () => {
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

    it('should correctly return what proxy.forward returns for POST request to /batch-emails/send-batch-random-same-email', () => {
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
      auth0Id: ['auth0|example1', 'auth0|example2', 'auth0|example3'],
      difficulty: EmailDifficulty.HARD,
      scheduledFrom: new Date('2026-06-24T08:00:00.000Z'),
      scheduledTo: new Date('2026-06-24T09:00:00.000Z'),
      randomisedTimes: false,
    };

    it('should forwards a POST request to /batch-emails/send-batch-random-different-email', () => {
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

    it('should correctly return what proxy.forward returns for POST request to /batch-emails/send-batch-random-different-email', () => {
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