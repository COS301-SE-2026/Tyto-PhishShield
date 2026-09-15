/**
 * Service: mailing-service
 *
 * Unit tests for EmailController.
 * Verifies that each controller method correctly delegates to EmailService
 * and maps the response into the expected return shape.
 *
 * Test suites:
 * - {@link createEmail} - Verifies a new email record is created and returned.
 * - {@link getAllEmails} - Verifies an array of email records is returned.
 * - {@link getEmailByReference} - Verifies a single email is returned by reference number.
 * - {@link updateEmail} - Verifies an email record is updated and the result returned.
 * - {@link sendEmail} - Verifies the send sequence is triggered and the result mapped correctly.
 * - {@link scheduleSendEmail} - Verifies the schedule sequence is triggered and the result mapped correctly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailsDto } from '../dto/emails.dto';
import { EmailDifficulty } from '../entities/email-template.entity';
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

  // Mock the email data returned from db
  const mockEmail = {
    email_id: 'uuid-1234',
    reference_number: 'PHISH-001',
    sender: 'domain.com',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
    created_at: new Date(),
  };

  // Mock the EmailsDto
  const mockCreateDto: EmailsDto = {
    sender: 'domain.com',
    subject: 'Urgent: Password Reset',
    content: '<p>Please reset your password</p>',
    difficulty: EmailDifficulty.EASY,
  };

  const mockSendSingleEmail: SendSingleEmailDto = {
    auth0Id: 'auth0|1',
    senderCustomName: 'it-support',
    senderAuth0Id: undefined,
    alias: 'IT Support',
  };

  const mockScheduleSingleEmail: ScheduleSingleEmailDto = {
    auth0Id: 'auth0|1',
    scheduledAt: new Date('2026-05-25T14:30:00.000Z'),
    senderCustomName: 'it-support',
    senderAuth0Id: undefined,
    alias: 'IT Support',
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
    it('should send a single email to recipient with senderName and alias', async () => {
      const serviceResponse = {
        success: true,
        message: 'Email sent successfully',
        deliveryId: 'resend-id',
      };
      mockEmailService.sendEmail.mockResolvedValue(serviceResponse);

      const result = await controller.sendEmail('PHISH-001', mockSendSingleEmail);

      expect(service.sendEmail).toHaveBeenCalledWith(
        'PHISH-001',
        mockSendSingleEmail.auth0Id,
        mockSendSingleEmail.senderCustomName,
        mockSendSingleEmail.senderAuth0Id,
        mockSendSingleEmail.alias,
      );
      expect(result).toEqual(serviceResponse);
    });

    it('should pass undefined senderName/alias through when non are provided', async () => {
      const minimalDto: SendSingleEmailDto = { auth0Id: 'auth0|1' };
      mockEmailService.sendEmail.mockResolvedValue({ success: true, message: 'sent', deliveryId: 'id' });

      await controller.sendEmail('PHISH-001', minimalDto);

      expect(service.sendEmail).toHaveBeenCalledWith('PHISH-001', 'auth0|1', undefined, undefined, undefined);
    });
  });

  describe('scheduleSendEmail', () => {
    it('should schedule a single email to recipient with senderName and alias', async () => {
      const serviceResponse = {
        success: true,
        message: 'Email scheduled successfully',
        deliveryId: 'schedule-id',
      };
      mockEmailService.scheduleSendEmail.mockResolvedValue(serviceResponse);

      const result = await controller.scheduleSendEmail('PHISH-001', mockScheduleSingleEmail);

      expect(service.scheduleSendEmail).toHaveBeenCalledWith(
        'PHISH-001',
        mockScheduleSingleEmail.auth0Id,
        mockScheduleSingleEmail.scheduledAt,
        mockScheduleSingleEmail.senderCustomName,
        mockScheduleSingleEmail.senderAuth0Id,
        mockScheduleSingleEmail.alias,
      );
      expect(result).toEqual(serviceResponse);
    });
  });
});
