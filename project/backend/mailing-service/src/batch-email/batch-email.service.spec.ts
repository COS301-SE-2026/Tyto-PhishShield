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
import { Emails, EmailDifficulty } from '../entities/emails.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const mockResendBatchSend = jest.fn().mockResolvedValue({ error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    batch: { send: mockResendBatchSend },
  })),
}));

const FUTURE_DATE_FROM = new Date('2026-08-01T10:00:00.000Z');
const FUTURE_DATE_TO = new Date('2026-08-01T12:00:00.000Z');

describe('BatchEmailService', () => {
  let service: BatchEmailService;

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
        { provide: getRepositoryToken(Emails), useValue: mockEmailRepository },
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
    const recipients = ['a@example.com', 'b@example.com'];

    it('should send a batch and return success using alias', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({ error: null });

      const result = await service.sendBatchWithReference('PHISH-001', recipients);

      expect(mockEmailRepository.find).toHaveBeenCalled();
      expect(mockResendBatchSend).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            from: `${mockEmail.alias} <${mockEmail.sender}>`,
            to: [recipients[0]],
          }),
        ]),
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('PHISH-001');
      expect(result.message).toContain(`${recipients.length}`);
    });

    it('should send a batch using sender directly when alias is absent', async () => {
      const emailWithoutAlias = { ...mockEmail, alias: undefined };
      mockEmailRepository.find.mockResolvedValue([emailWithoutAlias]);
      mockResendBatchSend.mockResolvedValue({ error: null });

      await service.sendBatchWithReference('PHISH-001', recipients);

      expect(mockResendBatchSend).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ from: mockEmail.sender }),
        ]),
      );
    });

    it('should throw InternalServerErrorException when Resend returns an error object', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({
        error: { message: 'Resend rejected the request' },
      });

      await expect(
        service.sendBatchWithReference('PHISH-001', recipients),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when Resend throws', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        service.sendBatchWithReference('PHISH-001', recipients),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendBatchRandomSameEmail', () => {
    const recipients = ['a@example.com', 'b@example.com'];

    it('should throw BadRequestException when scheduledTo is before scheduledFrom', async () => {
      await expect(
        service.sendBatchRandomSameEmail(
          recipients,
          EmailDifficulty.MEDIUM,
          FUTURE_DATE_TO,
          FUTURE_DATE_FROM,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sends a single batch with a scheduledAt per recipient when randomisedTimes=true and dates differs', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({ error: null });

      const result = await service.sendBatchRandomSameEmail(
        recipients,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        true,
      );

      expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
      const [payload] = mockResendBatchSend.mock.calls[0];
      expect(payload).toHaveLength(recipients.length);
      payload.forEach((item: any) => {
        expect(item.scheduledAt).toEqual(expect.any(String));
      });
      expect(result.success).toBe(true);
    });

    it('should send a batch at the exact scheduledFrom when dates are the same instant', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmail]);
      mockEmailRepository.find.mockResolvedValue([mockEmail]);
      mockResendBatchSend.mockResolvedValue({ error: null });

      const sameDate = new Date('2026-08-01T10:00:00.000Z');

      const result = await service.sendBatchRandomSameEmail(
        recipients,
        EmailDifficulty.MEDIUM,
        sameDate,
        sameDate,
        false,
      );

      expect(mockResendBatchSend).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when no emails exist for the difficulty', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await expect(
        service.sendBatchRandomSameEmail(
          recipients,
          EmailDifficulty.EASY,
          FUTURE_DATE_FROM,
          FUTURE_DATE_TO,
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendBatchRandomDifferentEmail', () => {
    const recipients = ['a@example.com', 'b@example.com'];

    it('should throw BadRequestException when scheduledTo is before scheduledFrom', async () => {
      await expect(
        service.sendBatchRandomDifferentEmail(
          recipients,
          EmailDifficulty.MEDIUM,
          FUTURE_DATE_TO,
          FUTURE_DATE_FROM,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sends a single resend batch call with round-robin templates when randomisedTimes=true and dates differ', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);
      mockEmailRepository.find.mockResolvedValue(mockEmails);
      mockResendBatchSend.mockResolvedValue({ error: null });

      const result = await service.sendBatchRandomDifferentEmail(
        recipients,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        true,
      );

      expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
      const [payload] = mockResendBatchSend.mock.calls[0];
      expect(payload).toHaveLength(recipients.length);
      expect(result.success).toBe(true);
    });

    it('should send a batch at same time with different templates', async () => {
      const mockEmails = [
        { ...mockEmail, referenceNumber: 'PHISH-AAA' },
        { ...mockEmail, referenceNumber: 'PHISH-BBB' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmails);
      mockEmailRepository.find.mockResolvedValue(mockEmails);
      mockResendBatchSend.mockResolvedValue({ error: null });

      const result = await service.sendBatchRandomDifferentEmail(
        recipients,
        EmailDifficulty.MEDIUM,
        FUTURE_DATE_FROM,
        FUTURE_DATE_TO,
        false,
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