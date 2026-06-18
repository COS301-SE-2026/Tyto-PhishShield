import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailsDto } from '../dto/emails.dto';
import { EmailDifficulty } from '../entities/emails.entity';
import { SendSingleEmailDto } from '../dto/send-single-email.dto';
import { ScheduleSingleEmailDto } from '../dto/schedule-single-email.dto';

jest.mock('../dto/mailing-post-return.dto', () => {
  return {
    MailingPostReturnDto: jest.fn().mockImplementation((data) => data),
  };
});

describe('EmailController', () => {
  let controller: EmailController;
  let service: EmailService;

  // Mock the EmailService
  const mockEmailService = {
    createEmail: jest.fn(),
    getAllEmails: jest.fn(),
    getEmailByReference: jest.fn(),
    updateEmail: jest.fn(),
    sendEmail: jest.fn(),
    scheduleSendEmail: jest.fn(),
  };

  // Mock the email data returned form db
  const mockEmail = {
    email_id: 'uuid-1234',
    reference_number: 'PHISH-001',
    sender: 'security@domain.com',
    alias: 'IT Support',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
    created_at: new Date(),
  };

  // Mock the EmailsDto
  const mockCreateDto: EmailsDto = {
    sender: 'security@domain.com',
    alias: 'IT Support',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
  };
  
  const mockSendSingleEmail: SendSingleEmailDto = {
    recipient: 'test@domain.com',
    emailReferenceNumber: 'PHISH-001',
  }
  
  const mockScheduleSingleEmail: ScheduleSingleEmailDto = {
    recipient: 'test@domain.com',
    scheduledAt: new Date('2026-05-25T14:30:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: mockEmailService }],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEmail', () => {
    it('should create and return an email', async () => {
      mockEmailService.createEmail.mockResolvedValue(mockEmail);

      const result = await controller.createEmail(mockCreateDto);

      expect(service.createEmail).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockEmail);
    });
  });
  describe('getAllEmails', () => {
    it('should return an array of emails', async () => {
      mockEmailService.getAllEmails.mockResolvedValue([mockEmail]);

      const result = await controller.getAllEmails();
      expect(service.getAllEmails).toHaveBeenCalled();
      expect(result).toEqual([mockEmail]);
    });
  });

  describe('getEmailByReference', () => {
    it('should return a single email by reference', async () => {
      mockEmailService.getEmailByReference.mockResolvedValue(mockEmail);

      const result = await controller.getEmailByReference('PHISH-001');
      expect(service.getEmailByReference).toHaveBeenCalledWith('PHISH-001');
      expect(result).toEqual(mockEmail);
    });
  });

  describe('updateEmail', () => {
    it('should update and return the email', async () => {
      const updateDto = { subject: 'Updated Subject' };
      const updatedEmail = { ...mockEmail, subject: 'Updated Subject' };
      mockEmailService.updateEmail.mockResolvedValue(updatedEmail);

      const result = await controller.updateEmail('PHISH-001', updateDto);
      expect(service.updateEmail).toHaveBeenCalledWith('PHISH-001', updateDto);
      expect(result).toEqual(updatedEmail);
    });
  });

  describe('sendEmail', () => {
    it('should trigger the email send sequence', async () => {
      const serviceResponse = {
        success: true,
        message: 'Email sent successfully',
        deliveryId: 'resend-id',
      };
      mockEmailService.sendEmail.mockResolvedValue(serviceResponse);

      const result = await controller.sendEmail('PHISH-001', mockSendSingleEmail);

      expect(service.sendEmail).toHaveBeenCalledWith(
        mockSendSingleEmail.emailReferenceNumber,
        mockSendSingleEmail.recipient
      );
      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully',
        deliveryId: 'resend-id',
      });
    });
  });

  describe('scheduleSendEmail', () => {
    it('should parse the date string and trigger the schedule sequence', async () => {
      const serviceResponse = {
        success: true,
        message: 'Email scheduled successfully',
        deliveryId: 'schedule-id',
      };
      mockEmailService.scheduleSendEmail.mockResolvedValue(serviceResponse);

      const result = await controller.scheduleSendEmail('PHISH-001', mockScheduleSingleEmail);

      expect(service.scheduleSendEmail).toHaveBeenCalledWith(
        mockScheduleSingleEmail.recipient,
        mockScheduleSingleEmail.scheduledAt
      );
      expect(result).toEqual({
        success: true,
        message: 'Email scheduled successfully',
        deliveryId: 'schedule-id',
      });
    });
  });
});
