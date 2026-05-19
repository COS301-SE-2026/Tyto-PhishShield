import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { GenerateEmailDto } from '../dto/generate-email.dto';
import { EmailDifficulty } from '../entities/generated-emails.entity';

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
  };

  // Mock the email data returned form db
  const mockEmail = {
    email_id: 'uuid-1234',
    reference_number: 'PHISH-001',
    sender: 'security@domain.com',
    alias: 'IT Support',
    recipient: 'target@company.com',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
    created_at: new Date(),
  };

  // Mock the GenerateEmailDto
  const mockCreateDto: GenerateEmailDto = {
    sender: 'security@domain.com',
    alias: 'IT Support',
    recipient: 'target@company.com',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
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
      const mockResponse = {
        success: true,
        message: 'Email sent successfully',
        data: { id: 'resend-id' },
      };
      mockEmailService.sendEmail.mockResolvedValue(mockResponse);

      const result = await controller.sendEmail('PHISH-001');
      expect(service.sendEmail).toHaveBeenCalledWith('PHISH-001');
      expect(result).toEqual(mockResponse);
    });
  });
});
