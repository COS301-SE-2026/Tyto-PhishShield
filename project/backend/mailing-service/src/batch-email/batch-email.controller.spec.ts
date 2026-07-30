/**
 * Service: mailing-service
 *
 * Unit tests for BatchEmailController.
 * Verifies that each controller method correctly delegates to BatchEmailService
 * and maps the response into the expected BatchPostReturnDto shape.
 *
 * Test suites:
 * - {@link sendBatchWithReference} - Verifies batch send is triggered and result mapped correctly.
 * - {@link sendBatchRandom} - Verifies random same-email batch is triggered and result mapped correctly.
 * - {@link sendBatchRandomDifferentEmail} - Verifies random different-email batch is triggered and result mapped correctly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BatchEmailController } from './batch-email.controller';
import { BatchEmailService } from './batch-email.service';
import { EmailDifficulty } from '../entities/emails.entity';
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';
import { SendBatchRandomDto } from '../dto/send-batch-random.dto';

jest.mock('../dto/batch-post-return.dto', () => {
  return {
    BatchPostReturnDto: jest.fn().mockImplementation((data) => data),
  };
});

describe('BatchEmailController', () => {
  let controller: BatchEmailController;
  let service: BatchEmailService;

  const mockBatchEmailService = {
    sendBatchWithReference: jest.fn(),
    sendBatchRandomSameEmail: jest.fn(),
    sendBatchRandomDifferentEmail: jest.fn(),
  };

  const scheduledFrom = new Date('2026-08-01T10:00:00.000Z');
  const scheduledTo = new Date('2026-08-01T12:00:00.000Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchEmailController],
      providers: [
        { provide: BatchEmailService, useValue: mockBatchEmailService },
      ],
    }).compile();

    controller = module.get<BatchEmailController>(BatchEmailController);
    service = module.get<BatchEmailService>(BatchEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendBatchWithReference', () => {
    const referenceNumber = 'PHISH-001';
    const body: SendBatchEmailDto = {
      recipients: ['a@example.com', 'b@example.com'],
    };

    it('should delegate to sendBatchWithReference', async () => {
      mockBatchEmailService.sendBatchWithReference.mockResolvedValue({
        success: true,
        message: 'Batch sent.',
      });

      await controller.sendBatchWithReference(referenceNumber, body);

      expect(service.sendBatchWithReference).toHaveBeenCalledWith(
        referenceNumber,
        body.recipients,
      );
    });

    it('should return a BatchPostReturnDto with success and message', async () => {
      mockBatchEmailService.sendBatchWithReference.mockResolvedValue({
        success: true,
        message: 'Batch sent.',
      });

      const result = await controller.sendBatchWithReference(
        referenceNumber,
        body,
      );

      expect(result).toEqual({ success: true, message: 'Batch sent.' });
    });
  });

  describe('sendBatchRandom', () => {
    const body: SendBatchRandomDto = {
      recipients: ['a@example.com', 'b@example.com'],
      difficulty: EmailDifficulty.MEDIUM,
      scheduledFrom,
      scheduledTo,
      randomisedTimes: false,
    };

    it('should delegate to sendBatchRandomSameEmail', async () => {
      mockBatchEmailService.sendBatchRandomSameEmail.mockResolvedValue({
        success: true,
        message: 'test message',
      });

      await controller.sendBatchRandom(body);

      expect(service.sendBatchRandomSameEmail).toHaveBeenCalledWith(
        body.recipients,
        body.difficulty,
        body.scheduledFrom,
        body.scheduledTo,
        body.randomisedTimes,
      );
    });

    it('should return a BatchPostReturnDto with success and message', async () => {
      mockBatchEmailService.sendBatchRandomSameEmail.mockResolvedValue({
        success: true,
        message: 'test message',
      });

      const result = await controller.sendBatchRandom(body);

      expect(result).toEqual({
        success: true,
        message: 'test message',
      });
    });
  });

  describe('sendBatchRandomDifferentEmail', () => {
    const body: SendBatchRandomDto = {
      recipients: ['a@example.com', 'b@example.com'],
      difficulty: EmailDifficulty.HARD,
      scheduledFrom,
      scheduledTo,
      randomisedTimes: true,
    };

    it('should call service.sendBatchRandomDifferentEmail with all DTO fields', async () => {
      mockBatchEmailService.sendBatchRandomDifferentEmail.mockResolvedValue({
        success: true,
        message: 'test message',
      });

      await controller.sendBatchRandomDifferentEmail(body);

      expect(service.sendBatchRandomDifferentEmail).toHaveBeenCalledWith(
        body.recipients,
        body.difficulty,
        body.scheduledFrom,
        body.scheduledTo,
        body.randomisedTimes,
      );
    });

    it('should return a BatchPostReturnDto with success and message', async () => {
      mockBatchEmailService.sendBatchRandomDifferentEmail.mockResolvedValue({
        success: true,
        message: 'test message',
      });

      const result = await controller.sendBatchRandomDifferentEmail(body);

      expect(result).toEqual({
        success: true,
        message: 'test message',
      });
    });
  });
});
