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
import { EmailsDto } from '../dto/emails.dto';

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
      sender: 'onboarding@resend.dev',
      alias: 'Tester',
      subject: 'Test Subject',
      content: '<p>Test</p>',
      difficulty: 'medium' as any,
    };

    it('should call proxy.forward with the correct URL, method and body', () => {
      mockProxyService.forward.mockReturnValue({ referenceNumber: 'PHISH-001' });

      controller.createEmail(body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails`,
        method: 'POST',
        data: body,
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = { referenceNumber: 'PHISH-001' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.createEmail(body);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('getAllEmails', () => {
    it('should call proxy.forward with the correct URL and GET method', () => {
      mockProxyService.forward.mockReturnValue([]);

      controller.getAllEmails();

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails`,
        method: 'GET',
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = [{ referenceNumber: 'PHISH-001' }];
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.getAllEmails();

      expect(result).toBe(proxyResponse);
    });
  });

  describe('getEmailByReference', () => {
    const referenceNumber = 'PHISH-001';

    it('should call proxy.forward with the correct URL including the reference number', () => {
      mockProxyService.forward.mockReturnValue({ referenceNumber });

      controller.getEmailByReference(referenceNumber);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}`,
        method: 'GET',
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = { referenceNumber, subject: 'Test' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.getEmailByReference(referenceNumber);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('updateEmail', () => {
    const referenceNumber = 'PHISH-001';
    const body: Partial<EmailsDto> = { subject: 'Updated Subject' };

    it('should call proxy.forward with the correct URL, PATCH method and body', () => {
      mockProxyService.forward.mockReturnValue({ referenceNumber, subject: 'Updated Subject' });

      controller.updateEmail(referenceNumber, body);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}`,
        method: 'PATCH',
        data: body,
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = { referenceNumber, subject: 'Updated Subject' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.updateEmail(referenceNumber, body);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('sendEmail', () => {
    const referenceNumber = 'PHISH-001';
    const recipient = 'delivered@resend.dev';

    it('should call proxy.forward with the correct URL, method and recipient', () => {
      mockProxyService.forward.mockReturnValue({ success: true, message: 'sent instantly.' });

      controller.sendEmail(referenceNumber, recipient);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}/send-single`,
        method: 'POST',
        data: { recipient },
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = { success: true, message: 'sent instantly.', deliveryId: 'abc-123' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.sendEmail(referenceNumber, recipient);

      expect(result).toBe(proxyResponse);
    });
  });

  describe('scheduleSendEmail', () => {
    const referenceNumber = 'PHISH-001';
    const recipient = 'delivered@resend.dev';
    const scheduledAt = '2026-06-25T10:00:00.000Z';

    it('should call proxy.forward with the correct URL, method, recipient and scheduledAt', () => {
      mockProxyService.forward.mockReturnValue({ success: true, message: 'successfully scheduled' });

      controller.scheduleSendEmail(referenceNumber, recipient, scheduledAt);

      expect(mockProxyService.forward).toHaveBeenCalledWith({
        url: `${MAILING_SERVICE_URL}/emails/${referenceNumber}/schedule-send-single`,
        method: 'POST',
        data: { recipient, scheduledAt },
      });
    });

    it('should return whatever proxy.forward returns', () => {
      const proxyResponse = { success: true, message: 'successfully scheduled', deliveryId: 'xyz-456' };
      mockProxyService.forward.mockReturnValue(proxyResponse);

      const result = controller.scheduleSendEmail(referenceNumber, recipient, scheduledAt);

      expect(result).toBe(proxyResponse);
    });

    it('should include both recipient and scheduledAt in the forwarded data', () => {
      controller.scheduleSendEmail(referenceNumber, recipient, scheduledAt);

      const call = mockProxyService.forward.mock.calls[0][0];
      expect(call.data).toEqual({ recipient, scheduledAt });
    });
  });
});