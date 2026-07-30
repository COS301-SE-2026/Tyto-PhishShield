/**
 * Service: api-gateway
 *
 * Unit tests for the api-gateway EmailController.
 * Verifies that each endpoint correctly forwards requests to the mailing-service
 * URL via ProxyService and returns the proxy response unchanged.
 *
 * Test suites:
 * - {@link createEmail} - Verifies the correct URL, method, and body are forwarded on email creation.
 * - {@link getAllEmails} - Verifies a GET request is forwarded to retrieve all email records.
 * - {@link getEmailByReference} - Verifies the reference number is included in the forwarded URL.
 * - {@link updateEmail} - Verifies a PATCH request with body is forwarded correctly.
 * - {@link sendEmail} - Verifies the recipient is forwarded to the send-single endpoint.
 * - {@link scheduleSendEmail} - Verifies both recipient and scheduledAt are forwarded to the schedule endpoint.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailController } from './email.controller';
import { ProxyService } from '../../proxy/proxy.service';
import { EmailDifficulty, EmailsDto } from '../dto/emails.dto';

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

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: ProxyService, useValue: mockProxyService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEmail', () => {
    const body: EmailsDto = {
      sender: 'test@example.com',
      alias: 'Tester',
      subject: 'Test Subject',
      content: '<p>Test</p>',
      difficulty: EmailDifficulty.MEDIUM,
    };

    it('should forwards a POST request to /emails', () => {
      mockProxyService.forward.mockReturnValue({
        referenceNumber: 'PHISH-001',
      });

      controller.createEmail(body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails`,
        method: 'POST',
        data: body,
      });
    });

    it('should correctly return what proxy.forward returns for POST request to /emails', () => {
      const proxyResponse = { referenceNumber: 'PHISH-001' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.createEmail(body);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('getAllEmails', () => {
    it('should forward a GET request to /emails', () => {
      mockProxyService.forward.mockReturnValue([]);

      controller.getAllEmails();

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails`,
        method: 'GET',
      });
    });

    it("should correctly return what proxy.forward returns for GET request to /emails", () => {
      const proxyResponse = [{ referenceNumber: 'PHISH-001' }];
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.getAllEmails();

      expect(result).toBe(proxyResponse);
    });
  });

  describe('getEmailByReference', () => {
    const referenceNumber = 'PHISH-001';

    it('should forward a GET request to /emails/:referenceNumber', () => {
      mockProxyService.forward.mockReturnValue({ referenceNumber });

      controller.getEmailByReference(referenceNumber);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}`,
        method: 'GET',
      });
    });

    it('should correctly return what proxy.forward returns for GET request to /emails/:referenceNumber', () => {
      const proxyResponse = { referenceNumber, subject: 'Test' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.getEmailByReference(referenceNumber);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('updateEmail', () => {
    const referenceNumber = 'PHISH-001';
    const body: Partial<EmailsDto> = { subject: 'Updated Subject' };

    it('should forward a PATCH request to /emails/:referenceNumber', () => {
      mockProxyService.forward.mockReturnValue({
        referenceNumber,
        subject: 'Updated Subject',
      });

      controller.updateEmail(referenceNumber, body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}`,
        method: 'PATCH',
        data: body,
      });
    });

    it('should correctly return what proxy.forward returns for PATCH request to /emails/:referenceNumber', () => {
      const proxyResponse = { referenceNumber, subject: 'Updated Subject' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.updateEmail(referenceNumber, body);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('sendEmail', () => {
    const referenceNumber = 'PHISH-001';
    const recipient = 'delivered@resend.dev';

    it('should forward a PATCH request to /emails/:referenceNumber/send-single', () => {
      mockProxyService.forward.mockReturnValue({
        success: true,
        message: 'sent instantly.',
      });

      controller.sendEmail(referenceNumber, recipient);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}/send-single`,
        method: 'POST',
        data: { recipient },
      });
    });

    it('should correctly return what proxy.forward returns for PATCH request to /emails/:referenceNumber/send-single', () => {
      const proxyResponse = {
        success: true,
        message: 'sent instantly.',
        deliveryId: 'abc-123',
      };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.sendEmail(referenceNumber, recipient);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('scheduleSendEmail', () => {
    const referenceNumber = 'PHISH-001';
    const recipient = 'delivered@resend.dev';
    const scheduledAt = '2026-06-25T10:00:00.000Z';

    it('should forward a PATCH request to /emails/:referenceNumber/schedule-send-single', () => {
      mockProxyService.forward.mockReturnValue({
        success: true,
        message: 'successfully scheduled',
      });

      controller.scheduleSendEmail(referenceNumber, recipient, scheduledAt);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}/schedule-send-single`,
        method: 'POST',
        data: { recipient, scheduledAt },
      });
    });

    it('should correctly return what proxy.forward returns for PATCH request to /emails/:referenceNumber/schedule-send-single', () => {
      const proxyResponse = {
        success: true,
        message: 'successfully scheduled',
        deliveryId: 'xyz-456',
      };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.scheduleSendEmail(
        referenceNumber,
        recipient,
        scheduledAt,
      );

      expect(result).toBe(proxyResponse);
    });

    it('should include both recipient and scheduledAt in the forwarded data', () => {
      controller.scheduleSendEmail(referenceNumber, recipient, scheduledAt);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.data).toEqual({ recipient, scheduledAt });
    });
  });
});