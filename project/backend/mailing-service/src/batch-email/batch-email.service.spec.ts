/**
 * Service: mailing-service
 *
 * Unit tests for BatchEmailService.
 * Verifies batch dispatch and scheduling logic, including random email selection,
 * alias handling, time windowing, and error propagation.
 *
 * Test suites:
 * - {@link sendBatchWithReference} - Batch send to many recipients with a fixed template.
 * - {@link sendBatchRandomSameEmail} - Batch send/schedule using one randomly selected template.
 * - {@link sendBatchRandomDifferentEmail} - Batch schedule using different templates per recipient.
 * - {@link getRandomEmailByDifficulty} - Random email lookup by difficulty.
 * - {@link getRandomEmailByDifficultyArray} - Random pool lookup by difficulty.
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
import { EmailService } from '../email/email.service';
import { EmailTemplateEntity, EmailDifficulty } from '../entities/email-template.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserEntity } from '../entities/user.entity';
import { WaveService } from '../wave/wave.service';



const mockResendBatchSend = jest.fn().mockResolvedValue({
  data: { data: [{
    id: 'resend-id-1'
    },{
    id: 'resend-id-2'
    }] },
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
      { auth0Id: 'auth0|1', email: 'test@example.com' },
      { auth0Id: 'auth0|2', email: 'test@example.com' },
    ]),
  };

  const mockEmailService = {
    getEmailByReference: jest.fn(),
    scheduleSendEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY')
        return 'test_api_key';
      return null;
    }),
  };

  const mockAmqpConnection = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmail = {
    email_id: 'uuid-1234',
    referenceNumber: 'PHISH-001',
    sender: 'admin@domain.com',
    alias: 'Admin',
    subject: 'Action Required',
    content: '<p>Click here</p>',
    difficulty: EmailDifficulty.MEDIUM,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchEmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: getRepositoryToken(EmailTemplateEntity), useValue: mockEmailRepository },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepository },
        { provide: WaveService, useValue: mockWaveService },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    service = module.get<BatchEmailService>(BatchEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.limit.mockReturnThis();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendBatchWithReference', () => {
    const auth0Ids = ['auth0|1', 'auth0|2'];

    it('should send a batch and return success using alias', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({
        data: { data: [{ id: 'resend-id-1' }, { id: 'resend-id-2' }] },
        error: null,
      });

      const result = await service.sendBatchWithReference('PHISH-001', auth0Ids);

      expect(mockEmailRepository.find).toHaveBeenCalled();
      expect(mockResendBatchSend).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            from: `${mockEmail.alias} <${mockEmail.sender}>`,
            to: ['test@example.com'],
          }),
        ]),
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('PHISH-001');
      expect(result.message).toContain(`${auth0Ids.length}`);
    });

    it('should send a batch without alias', async () => {
      const emailWithoutAlias = { ...mockEmail, alias: undefined };
      mockEmailRepository.find.mockResolvedValue([emailWithoutAlias]);
      mockResendBatchSend.mockResolvedValue({ data: { data: [{ id: 'resend-1' }, { id: 'resend-2' }] },
  error: null });

      await service.sendBatchWithReference('PHISH-001', auth0Ids);

      expect(mockResendBatchSend).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ from: mockEmail.sender }),
        ]),
      );
    });

    it('should throw InternalServerErrorException when Resend returns an error', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({
        error: { message: 'Resend rejected the request' },
      });

      await expect(
        service.sendBatchWithReference('PHISH-001', auth0Ids),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when Resend throws', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        service.sendBatchWithReference('PHISH-001', auth0Ids),
      ).rejects.toThrow(InternalServerErrorException);
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

    it('sends a single batch with a scheduledAt per recipient when randomisedTimes=true and dates differs', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({
        data: { data: [{ id: 'resend-1' }, { id: 'resend-2' }] },
        error: null,
      });

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
      expect(result.success).toBe(true);
    });

    it('should send a batch at scheduledFrom when dates are same', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({ data: { data: [{ id: 'resend-1' }, { id: 'resend-2' }] },
  error: null });

      const sameDate = new Date('2026-08-01T10:00:00.000Z');

      const result = await service.sendBatchRandomSameEmail(
        auth0Ids,
        EmailDifficulty.MEDIUM,
        sameDate,
        sameDate,
        false,
        'Test wave',
        undefined,
      );

      expect(mockResendBatchSend).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when no emails exist for the difficulty', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await expect(
        service.sendBatchRandomSameEmail(
          auth0Ids,
          EmailDifficulty.EASY,
          FUTURE_DATE_FROM,
          FUTURE_DATE_TO,
          false,
          'Test wave',
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendBatchRandomDifferentEmail', () => {
    const auth0Ids = ['auth0|1', 'auth0|2'];

    it('should throw BadRequestException when scheduledTo is before scheduledFrom', async () => {
      await expect(
        service.sendBatchRandomDifferentEmail(
          auth0Ids,
          EmailDifficulty.MEDIUM,
          FUTURE_DATE_TO,
          FUTURE_DATE_FROM,
          false,
          'Test wave',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sends a single resend batch call when randomisedTimes=true and dates differ', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);
      mockEmailRepository.find.mockResolvedValue(mockEmails);
      mockResendBatchSend.mockResolvedValue({ data: { data: [{ id: 'resend-1' }, { id: 'resend-2' }] },
  error: null });

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

    it('should send a batch at same time with different templates', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);
      mockEmailRepository.find.mockResolvedValue(mockEmails);
      mockResendBatchSend.mockResolvedValue({ data: { data: [{ id: 'resend-1' }, { id: 'resend-2' }] },
  error: null });

      const result = await service.sendBatchRandomDifferentEmail(
        auth0Ids,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        false,
        'Test wave',
      );

      expect(mockResendBatchSend).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getRandomEmailByDifficulty', () => {
    it('should return the referenceNumber of a random email', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);

      const result = await service.getRandomEmailByDifficulty(EmailDifficulty.MEDIUM);

      expect(result).toBe(mockEmail.referenceNumber);
    });

    it('should throw NotFoundException when no email is found', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await expect(
        service.getRandomEmailByDifficulty(EmailDifficulty.EASY),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on DB failure', async () => {
      mockQueryBuilder.getMany.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.getRandomEmailByDifficulty(EmailDifficulty.HARD),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getRandomEmailByDifficultyArray', () => {
    it('should return an array of referenceNumbers', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);

      const result = await service.getRandomEmailByDifficultyArray(EmailDifficulty.MEDIUM, 2);

      expect(result).toEqual(['PHISH-AAA', 'PHISH-BBB']);
    });

    it('should throw InternalServerErrorException on DB failure', async () => {
      mockQueryBuilder.getMany.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.getRandomEmailByDifficultyArray(EmailDifficulty.MEDIUM, 2),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});