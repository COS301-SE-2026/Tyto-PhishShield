import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailingController } from './mailing.controller';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateEmailDto } from './dto/generate-email.dto';

describe('MailingController', () => {
  let controller: MailingController;
  let proxyService: ProxyService;

  const mockProxyService = {
    forward: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'MAILING_SERVICE_PORT') {
        return 3003;
      }
      return defaultValue;
    }),
  };

  const baseUrl = 'http://localhost:3003';
  const mockReference = 'PHISH-1234';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailingController],
      providers: [
        { provide: ProxyService, useValue: mockProxyService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MailingController>(MailingController);
    proxyService = module.get<ProxyService>(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEmail', () => {
    it('should forward a POST request to create an email', async () => {
      const dto = { subject: 'Test', content: 'Html' } as GenerateEmailDto;
      const expectedResponse = { id: '1', ...dto };
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.createEmail(dto);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails`,
        method: 'POST',
        data: dto,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAllEmails', () => {
    it('should forward a GET request to retrieve all emails', async () => {
      const expectedResponse = [{ id: '1' }, { id: '2' }];
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.getAllEmails();

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails`,
        method: 'GET',
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getEmailByReference', () => {
    it('should forward a GET request for a specific email', async () => {
      const expectedResponse = { reference_number: mockReference };
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.getEmailByReference(mockReference);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails/${mockReference}`,
        method: 'GET',
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateEmail', () => {
    it('should forward a PATCH request to update an email', async () => {
      const dto = { subject: 'Updated' } as GenerateEmailDto;
      const expectedResponse = { reference_number: mockReference, ...dto };
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.updateEmail(mockReference, dto);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails/${mockReference}`,
        method: 'PATCH',
        data: dto,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendEmail', () => {
    it('should forward a POST request to dispatch an email with recipient', async () => {
      const recipient = 'target@example.com';
      const expectedResponse = { success: true };
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.sendEmail(mockReference, recipient);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails/${mockReference}/send-single`,
        method: 'POST',
        data: { recipient },
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('scheduleSendEmail', () => {
    it('should forward a POST request to schedule an email with recipient and date', async () => {
      const recipient = 'target@example.com';
      const scheduledAt = '2026-05-25T14:30:00.000Z';
      const expectedResponse = { success: true };
      mockProxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.scheduleSendEmail(
        mockReference,
        recipient,
        scheduledAt,
      );

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: `${baseUrl}/emails/${mockReference}/schedule-send-single`,
        method: 'POST',
        data: { recipient, scheduledAt },
      });
      expect(result).toEqual(expectedResponse);
    });
  });
});
