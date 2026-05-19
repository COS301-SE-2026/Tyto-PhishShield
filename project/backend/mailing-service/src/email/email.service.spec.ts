import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import {
  GeneratedEmail,
  EmailDifficulty,
} from '../entities/generated-emails.entity';

// Mock Resend client
// mockResendSend is used to avoid using any.
const mockResendSend = jest.fn().mockResolvedValue({ id: 'mock-resend-id' });
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

  // Mock the getting the api key
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return 'test_api_key';
      return null;
    }),
  };

  // Mock email data
  const mockEmail = {
    email_id: 'uuid-1234',
    reference_number: 'PHISH-001',
    sender: 'admin@domain.com',
    alias: 'Admin',
    recipient: 'target@company.com',
    subject: 'Action Required',
    content: '<p>Click here</p>',
    difficulty: EmailDifficulty.HARD,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(GeneratedEmail),
          useValue: mockEmailRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
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

  describe('getEmailByReference', () => {
    it('should return an email if it exists', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const result = await service.getEmailByReference('PHISH-001');
      expect(mockEmailRepository.findOne).toHaveBeenCalledWith({
        where: { reference_number: 'PHISH-001' },
      });
      expect(result).toEqual(mockEmail);
    });

    it('should throw NotFoundException if email does not exist', async () => {
      mockEmailRepository.findOne.mockResolvedValue(null);

      await expect(service.getEmailByReference('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendEmail', () => {
    it('should successfully send an email and use alias', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      const result = await service.sendEmail('PHISH-001');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully');
      expect(result.data).toEqual({ id: 'mock-resend-id' });
    });

    it('should throw an InternalServerErrorException if the resend API fails', async () => {
      mockEmailRepository.findOne.mockResolvedValue(mockEmail);

      mockResendSend.mockRejectedValueOnce(new Error('API Down'));

      await expect(service.sendEmail('PHISH-001')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
