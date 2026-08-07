import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EmailStatusService } from './email-status.service';
import {
  EmailStatusEntity,
  EmailStatusEnum,
} from '../entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';

describe('EmailStatusService', () => {
  let service: EmailStatusService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockEmailStatus = {
    emailId: 'test-email-id',
    auth0Id: 'auth0|1',
    status: EmailStatusEnum.SENT,
  } as EmailStatusEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailStatusService,
        {
          provide: getRepositoryToken(EmailStatusEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EmailStatusService>(EmailStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStatus', () => {
    const statusCreateDto = {
      emailId: 'test-email-id',
      auth0Id: 'auth0|1',
      status: EmailStatusEnum.SENT,
    } as StatusCreateDto;

    it('should create a new status entry', async () => {
      mockRepository.create.mockReturnValue(mockEmailStatus);
      mockRepository.save.mockResolvedValue(mockEmailStatus);

      const result = await service.createStatus(statusCreateDto);
      expect(mockRepository.create).toHaveBeenCalledWith(statusCreateDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEmailStatus);
      expect(result).toEqual(mockEmailStatus);
    });

    it('should throw InternalServerErrorException if save fails', async () => {
      mockRepository.create.mockReturnValue(mockEmailStatus);
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(service.createStatus(statusCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getStatus', () => {
    const auth0Id = 'auth0|1';

    it('should return an array of status entries', async () => {
      mockRepository.find.mockResolvedValue([mockEmailStatus]);

      const result = await service.getStatus(auth0Id);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { auth0Id },
      });
      expect(result).toEqual([mockEmailStatus]);
    });

    it('should return an empty array if no entries are found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getStatus(auth0Id);

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException if find fails', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.getStatus(auth0Id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteStatus', () => {
    const emailId = 'test-email-id';

    it('should delete and return the found status entry', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmailStatus);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteStatus(emailId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { emailId },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith({ emailId });
      expect(result).toEqual(mockEmailStatus);
    });

    it('should throw NotFoundException if entry does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteStatus(emailId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if findOne fails', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteStatus(emailId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmailStatus);
      mockRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteStatus(emailId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
