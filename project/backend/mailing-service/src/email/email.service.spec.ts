/**
 * Service: mailing-service
 *
 * Unit tests for EmailService.
 * Verifies the business logic for email record management and
 * dispatching/scheduling emails through the mocked Resend API.
 *
 * Test suites:
 * - {@link createEmail} - Verifies a reference number is generated and the email record saved.
 * - {@link getEmailByReference} - Verifies lookup by reference number, including not-found handling.
 * - {@link sendEmail} - Verifies immediate dispatch with/without alias and API failure handling.
 * - {@link scheduleSendEmail} - Verifies scheduled dispatch with a future date and API failure handling.
 * - {@link getAllEmails} - Verifies all email records are fetched from the repository.
 * - {@link updateEmail} - Verifies partial updates are applied and the updated record returned.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import {
  EmailTemplateEntity,
  EmailDifficulty,
} from '../entities/email-template.entity';
import { EmailsDto } from '../dto/emails.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserEntity } from '../entities/user.entity';

const mockResendSend = jest.fn().mockResolvedValue({
  data: { id: 'mock-resend-id' },
  error: null,
});

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockResendSend,
        },
      };
    }),
  };
});

describe('EmailService', () => {
  let service: EmailService;

  // Mock repository
  const mockEmailRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  }

  // Mock the getting the api key
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return 'test_api_key';
      return null;
    }),
  };

  const mockAmqpConnection = {
    publish: jest.fn().mockResolvedValue(undefined),
  }

  // Mock email data
  const mockEmail = {
    email_id: 'uuid-1234',
    referenceNumber: 'PHISH-001',
    sender: 'admin@domain.com',
    alias: 'Admin',
    subject: 'Action Required',
    content: '<p>Click here</p>',
    difficulty: EmailDifficulty.HARD,
  };

  const mockUser = {
    auth0Id: 'auth0|1',
    name: 'Test User',
    email: 'test@example.com',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(EmailTemplateEntity),
          useValue: mockEmailRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmail', () => {
    it('should generate a reference number and save the email', async () => {
      const createDto: EmailsDto = {
        sender: 'admin@domain.com',
        alias: 'Admin',
        subject: 'Action Required',
        content: '<p>Click here</p>',
        difficulty: EmailDifficulty.HARD,
      };

      mockEmailRepository.create.mockReturnValue(mockEmail);
      mockEmailRepository.save.mockResolvedValue(mockEmail);

      const result = await service.createEmail(createDto);

      expect(mockEmailRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          referenceNumber: expect.stringMatching(/^PHISH-[0-9A-F]{8}$/),
        }),
      );
      expect(mockEmailRepository.save).toHaveBeenCalledWith(mockEmail);
      expect(result).toEqual(mockEmail);
    });

    it('should throw InternalServerErrorException when saving fails', async () => {
      const createDto: EmailsDto = {
        sender: 'admin@domain.com',
        alias: 'Admin',
        subject: 'Action Required',
        content: '<p>Click here</p>',
        difficulty: EmailDifficulty.HARD,
      };

      mockEmailRepository.create.mockReturnValue(mockEmail);
      mockEmailRepository.save.mockRejectedValue(new Error('db unavailable'));

      await expect(service.createEmail(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getEmailByReference', () => {
    it('should return an email if it exists', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const result = await service.getEmailByReference('PHISH-001');
      expect(mockEmailRepository.findOne).toHaveBeenCalledWith({
        where: { referenceNumber: 'PHISH-001' },
      });
      expect(result).toEqual(mockEmail);
    });

    it('should throw NotFoundException if email does not exist', async () => {
      mockEmailRepository.findOne.mockResolvedValue(null);

      await expect(service.getEmailByReference('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if no reference number is given', async () => {
      await expect(service.getEmailByReference('')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmailRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      mockEmailRepository.findOne.mockRejectedValue(new Error('db unavailable'));

      await expect(service.getEmailByReference('PHISH-001')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('sendEmail', () => {
    it('should successfully send an email and use alias', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const result = await service.sendEmail('PHISH-001', mockUser.auth0Id);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          from: `${mockEmail.alias} <${mockEmail.sender}>`,
        }),
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('sent instantly.');
      expect(result.deliveryId).toBe('mock-resend-id');
    });

    it('should successfully send an email without an alias', async () => {
      const emailWithoutAlias = { ...mockEmail };
      delete emailWithoutAlias.alias;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(emailWithoutAlias);

      const result = await service.sendEmail('PHISH-001', mockUser.auth0Id);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: emailWithoutAlias.sender,
          to: mockUser.email,
        }),
      );
      expect(result.success).toBe(true);
      expect(result.deliveryId).toBe('mock-resend-id');
    });

    it('should throw an InternalServerErrorException if resend API fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockResendSend.mockRejectedValueOnce(new Error('API Down'));

      await expect(
        service.sendEmail('PHISH-001', mockUser.auth0Id),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should succeed if publishing mailing.send event fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockAmqpConnection.publish.mockRejectedValueOnce(new Error('broker down'));

      const result = await service.sendEmail('PHISH-001', mockUser.auth0Id);

      expect(result.success).toBe(true);
      expect(result.deliveryId).toBe('mock-resend-id');
    });

    it('should throw error when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      await expect(
        service.sendEmail('PHISH-001', 'unknown-auth0-id'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('scheduleSendEmail', () => {
    it('should successfully schedule an email with the provided date', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const targetDate = new Date('2026-05-25T14:30:00.000Z');
      const result = await service.scheduleSendEmail(
        'PHISH-001',
        mockUser.auth0Id,
        targetDate,
      );

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          scheduledAt: targetDate.toISOString(),
        }),
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully scheduled');
      expect(result.deliveryId).toBe('mock-resend-id');
    });

    it('should throw error when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.scheduleSendEmail('PHISH-001', 'unknown-auth0-id', new Date()),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockEmailRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error when Resend returns an error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'invalid scheduledAt' },
      });

      await expect(
        service.scheduleSendEmail('PHISH-001', mockUser.auth0Id, new Date()),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw an InternalServerErrorException if scheduling fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockResendSend.mockRejectedValueOnce(new Error('API Down'));

      const targetDate = new Date();
      await expect(
        service.scheduleSendEmail(
          'PHISH-001',
          mockUser.auth0Id,
          targetDate,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should succeed when publishing mailing.schedule event fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockAmqpConnection.publish.mockRejectedValueOnce(new Error('broker down'));

      const targetDate = new Date('2026-05-25T14:30:00.000Z');
      const result = await service.scheduleSendEmail(
        'PHISH-001',
        mockUser.auth0Id,
        targetDate,
      );

      expect(result.success).toBe(true);
      expect(result.deliveryId).toBe('mock-resend-id');
    });
  });

  describe('getAllEmails', () => {
    it('should return an array of emails', async () => {
      mockEmailRepository.find.mockResolvedValue([mockEmail]);

      const result = await service.getAllEmails();

      expect(mockEmailRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockEmail]);
    });

    it('should throw InternalServerErrorException', async () => {
      mockEmailRepository.find.mockRejectedValue(new Error('db unavailable'));

      await expect(service.getAllEmails()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateEmail', () => {
    it('should update and return the email', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const updateDto = { subject: 'Updated Phishing Subject' };
      const updatedEmail = { ...mockEmail, ...updateDto };
      mockEmailRepository.save.mockResolvedValue(updatedEmail);

      const result = await service.updateEmail('PHISH-001', updateDto);

      expect(mockEmailRepository.findOne).toHaveBeenCalledWith({
        where: { referenceNumber: 'PHISH-001' },
      });
      expect(mockEmailRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
      expect(result).toEqual(updatedEmail);
    });

    it('should throw NotFoundException when the email does not exist', async () => {
      mockEmailRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEmail('INVALID', { subject: 'New subject' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockEmailRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when saving fails', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);
      mockEmailRepository.save.mockRejectedValue(new Error('db unavailable'));

      await expect(
        service.updateEmail('PHISH-001', { subject: 'New subject' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
