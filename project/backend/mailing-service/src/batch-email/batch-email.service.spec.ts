/**
 * Service: mailing-service
 *
 * Unit tests for BatchEmailService.
 * Verifies batch dispatch and scheduling logic, including random email selection,
 * alias handling, time windowing, event publishing, and error propagation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BatchEmailService } from './batch-email.service';
import { EmailTemplateEntity, EmailDifficulty } from '../entities/email-template.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserEntity } from '../entities/user.entity';
import { WaveService } from '../wave/wave.service';
import { VariableResolverService } from '../shared-services/variable-resolver.service';
import { SenderResolverService } from '../shared-services/sender-resolver.service';
import { TrackingLinkService } from '../shared-services/tracking-link.service';
import { Department } from '@phishshield/dto';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

const mockResendBatchSend = jest.fn().mockResolvedValue({
  data: {
    data: [{ id: 'resend-id-1' }, { id: 'resend-id-2' }],
  },
  error: null,
});

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    batch: { send: mockResendBatchSend },
  })),
}));

const FUTURE_DATE_FROM = new Date(Date.now() + 24 * 60 * 60 * 1000);
const FUTURE_DATE_TO = new Date(Date.now() + 26 * 60 * 60 * 1000);

describe('BatchEmailService', () => {
  let service: BatchEmailService;

  const mockWaveService = {
    saveWave: jest.fn().mockResolvedValue({ id: 'wave-uuid' }),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockEmailRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    find: jest.fn().mockResolvedValue([
      { auth0Id: 'auth0|1', email: 'test@example.com', name: 'Test User 1', department: 'IT' },
      { auth0Id: 'auth0|2', email: 'test@example.com', name: 'Test User 2', department: 'HR' },
    ]),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return 'test_api_key';
      if (key === 'BUSINESS_NAME') return 'TestBusiness';
      if (key === 'TRACKING_LINK') return 'http://localhost/track';
      return null;
    }),
  };

  const mockAmqpConnection = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmail = {
    email_id: 'uuid-1234',
    referenceNumber: 'PHISH-001',
    sender: 'domain.com',
    subject: 'Action Required',
    content: '<p>Click here to track: {{ tracking_link }}</p>',
    difficulty: EmailDifficulty.MEDIUM,
    senderDepartment: undefined as Department | undefined,
  };

  const mockEmployeeInfoRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockVariableResolverService = { substitute: jest.fn((text: string) => text) };
  const mockSenderResolverService = { resolveFromAddress: jest.fn().mockReturnValue('resolved-sender@domain.com') };
  const mockTrackingLinkService = { replace: jest.fn((content: string) => ({ content, token: 'mock-token' })) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchEmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(EmailTemplateEntity), useValue: mockEmailRepository },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepository },
        { provide: WaveService, useValue: mockWaveService },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
        { provide: VariableResolverService, useValue: mockVariableResolverService },
        { provide: SenderResolverService, useValue: mockSenderResolverService },
        { provide: TrackingLinkService, useValue: mockTrackingLinkService },
        { provide: getRepositoryToken(EmployeeInfoEntity), useValue: mockEmployeeInfoRepository},
      ],
    }).compile();

    service = module.get<BatchEmailService>(BatchEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockVariableResolverService.substitute.mockImplementation((text: string) => text);
    mockSenderResolverService.resolveFromAddress.mockReturnValue('resolved-sender@domain.com');
    mockTrackingLinkService.replace.mockImplementation((content: string) => ({ content, token: 'mock-token' }));
    mockUserRepository.find.mockResolvedValue([
      { auth0Id: 'auth0|1', email: 'test@example.com', name: 'Test User 1', department: 'IT' },
      { auth0Id: 'auth0|2', email: 'test@example.com', name: 'Test User 2', department: 'HR' },
    ]);
    mockEmployeeInfoRepository.find.mockReturnValue([]);
    mockEmail.senderDepartment = undefined;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendBatchWithReference', () => {
    const auth0Ids = ['auth0|1', 'auth0|2'];

    it('should send a batch, resolve the sender via the resolver, and publish an event', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);

      const result = await service.sendBatchWithReference('PHISH-001', auth0Ids, 'it-support', undefined,'IT Support');

      expect(mockEmailRepository.find).toHaveBeenCalled();
      expect(mockSenderResolverService.resolveFromAddress).toHaveBeenCalledWith(
        mockEmail, expect.any(String), 'it-support', undefined, 'IT Support',
      );
      expect(mockResendBatchSend).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ from: 'resolved-sender@domain.com', to: ['test@example.com'] })]),
      );
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'mailing-event-exchange', 'mailing.batch_send', expect.objectContaining({ entries: expect.any(Array) }), { mandatory: true },
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('PHISH-001');
    });

    it('should delegate to the resolver with undefined sender fields when none are provided', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);

      await service.sendBatchWithReference('PHISH-001', auth0Ids);

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(mockSenderResolverService.resolveFromAddress).toHaveBeenCalledWith(
        mockEmail, expect.any(String), undefined, undefined, undefined,
      );
    });

    it('should throw InternalServerErrorException when the variable resolver rejects a template', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockVariableResolverService.substitute.mockImplementationOnce(() => {
        throw new InternalServerErrorException(
          'Template "PHISH-001" contains an unsupported or unavailable variable: {{unknown_variable}}',
        );
      });

      await expect(service.sendBatchWithReference('PHISH-001', auth0Ids, 'it-support')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendBatchRandomSameEmail', () => {
    const auth0Ids = ['auth0|1', 'auth0|2'];

    it('should throw BadRequestException when scheduledTo is before scheduledFrom', async () => {
      await expect(
        service.sendBatchRandomSameEmail(
          auth0Ids,
          EmailDifficulty.MEDIUM,
          FUTURE_DATE_TO,
          FUTURE_DATE_FROM,
          false,
          'Test wave',
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should bypass random lookup if referenceNumber is provided explicitly', async () => {
      const email = { ...mockEmail, referenceNumber: 'PHISH-EXPLICIT' };
      mockEmailRepository.find.mockResolvedValue([email]);

      const result = await service.sendBatchRandomSameEmail(
        auth0Ids,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        false,
        'Test wave',
        'PHISH-EXPLICIT',
      );

      expect(mockQueryBuilder.getMany).not.toHaveBeenCalled();

      expect(mockEmailRepository.find).toHaveBeenCalled();

      expect(result.success).toBe(true);
    });

    it('sends a single batch with a scheduledAt per recipient when randomisedTimes=true and dates differs', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);

      const result = await service.sendBatchRandomSameEmail(
        auth0Ids,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        true,
        'Test wave',
        undefined,
      );

      expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
      const [payload] = mockResendBatchSend.mock.calls[0];
      expect(payload).toHaveLength(auth0Ids.length);
      payload.forEach((item: any) => {
        expect(item.scheduledAt).toEqual(expect.any(String));
      });
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'mailing-event-exchange',
        'mailing.batch_schedule',
        expect.any(Object),
        expect.any(Object)
      );

      expect(result.success).toBe(true);
    });

    it('should pass senderCustomName, senderAuth0Id, and alias through to every recipient dispatch', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);

      await service.sendBatchRandomSameEmail(
        auth0Ids, EmailDifficulty.MEDIUM, FUTURE_DATE_FROM, FUTURE_DATE_TO, false, 'Test wave', undefined,
        'it-support', undefined,'IT Support',
      );

      expect(mockSenderResolverService.resolveFromAddress).toHaveBeenCalledTimes(auth0Ids.length);
      auth0Ids.forEach((auth0Id) => {
        expect(mockSenderResolverService.resolveFromAddress).toHaveBeenCalledWith(
          expect.any(Object), auth0Id, 'it-support', undefined, 'IT Support',
        );
      });
    });
  });

  describe('sendBatchRandomDifferentEmail', () => {
    const auth0Ids = ['auth0|1', 'auth0|2'];

    it('sends a single resend batch call when randomisedTimes=true and dates differ', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);
      mockEmailRepository.find.mockResolvedValue(mockEmails);

      const result = await service.sendBatchRandomDifferentEmail(
        auth0Ids,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        true,
        'Test wave',
      );

      expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
      const [payload] = mockResendBatchSend.mock.calls[0];
      expect(payload).toHaveLength(auth0Ids.length);
      expect(result.success).toBe(true);
    });
  });

  describe('getRandomEmailByDifficultyArray', () => {
    it('should throw InternalServerErrorException on DB failure', async () => {
      mockQueryBuilder.getMany.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.getRandomEmailByDifficultyArray(EmailDifficulty.MEDIUM, 2),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});