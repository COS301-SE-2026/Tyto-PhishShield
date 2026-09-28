import { Test, TestingModule } from '@nestjs/testing';
import { WaveService } from './wave.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WaveEntity } from '../entities/wave.entity';
import { WaveRecipientEntity } from '../entities/wave-recipient.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { NotFoundException } from '@nestjs/common';
import { WaveDto } from '../dto/wave.dto';
import { In } from 'typeorm';

describe('WaveService', () => {
  let service: WaveService;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockWaveRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockWaveRecipientRepository = {
    create: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockAmqpConnection = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const mockDateFrom = new Date('2026-09-01T08:00:00.000Z');
  const mockDateTo = new Date('2026-09-05T17:00:00.000Z');

  const mockWaveEntity: WaveEntity = {
    id: 'wave-uuid-1',
    waveName: 'Test Wave',
    scheduledFrom: mockDateFrom,
    scheduledTo: mockDateTo,
    sameEmail: true,
    randomisedTimes: true,
    recipients: [
      { id: 'recipient-uuid-1' } as WaveRecipientEntity,
    ],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaveService,
        {
          provide: getRepositoryToken(WaveEntity),
          useValue: mockWaveRepository,
        },
        {
          provide: getRepositoryToken(WaveRecipientEntity),
          useValue: mockWaveRecipientRepository,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<WaveService>(WaveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveWave', () => {
    const waveDto: WaveDto = {
      waveName: 'Test Wave',
      scheduledFrom: mockDateFrom.toISOString(),
      scheduledTo: mockDateTo.toISOString(),
      sameEmail: true,
      randomisedTimes: true,
      recipients: [
        {
          auth0Id: 'auth0|1',
          referenceNumber: 'REF-001',
          emailId: 'email-1',
          scheduledAt: mockDateFrom,
        },
      ],
    };

    it('should create, save a wave, and publish a wave.create event', async () => {
      mockWaveRecipientRepository.create.mockReturnValue({} as WaveRecipientEntity);
      mockWaveRepository.create.mockReturnValue(mockWaveEntity);
      mockWaveRepository.save.mockResolvedValue(mockWaveEntity);

      const result = await service.saveWave(waveDto);

      expect(mockWaveRecipientRepository.create).toHaveBeenCalledTimes(1);
      expect(mockWaveRepository.create).toHaveBeenCalled();
      expect(mockWaveRepository.save).toHaveBeenCalledWith(mockWaveEntity);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'wave-event-exchange',
        'wave.create',
        {
          waveId: mockWaveEntity.id,
          waveName: mockWaveEntity.waveName,
          scheduledFrom: mockWaveEntity.scheduledFrom.toISOString(),
          scheduledTo: mockWaveEntity.scheduledTo.toISOString(),
          sameEmail: mockWaveEntity.sameEmail,
          randomisedTimes: mockWaveEntity.randomisedTimes,
          numberOfRecipients: 1,
        },
      );

      expect(result).toEqual(mockWaveEntity);
    });

    it('should throw an error and log if saving to the database fails', async () => {
      mockWaveRepository.create.mockReturnValue(mockWaveEntity);
      mockWaveRepository.save.mockRejectedValue(new Error('DB Connection Failed'));

      await expect(service.saveWave(waveDto)).rejects.toThrow('DB Connection Failed');
      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });
  });

  describe('getWaveWithId', () => {
    it('should return a wave if found', async () => {
      mockWaveRepository.findOne.mockResolvedValue(mockWaveEntity);

      const result = await service.getWaveWithId('wave-uuid-1');

      expect(mockWaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'wave-uuid-1' },
        relations: ['recipients'],
      });
      expect(result).toEqual(mockWaveEntity);
    });

    it('should throw NotFoundException if wave does not exist', async () => {
      mockWaveRepository.findOne.mockResolvedValue(null);

      await expect(service.getWaveWithId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWavesWithAuth0Id', () => {
    it('should return waves associated with a specific user', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([{ waveId: 'wave-uuid-1' }]);
      mockWaveRepository.find.mockResolvedValue([mockWaveEntity]);

      const result = await service.getWavesWithAuth0Id('auth0|1');

      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
      expect(mockWaveRepository.find).toHaveBeenCalledWith({
        where: { id: In(['wave-uuid-1']) },
        relations: ['recipients'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockWaveEntity]);
    });

    it('should return an empty array early if no rows are found from query builder', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getWavesWithAuth0Id('auth0|unknown');

      expect(result).toEqual([]);
      expect(mockWaveRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('getAllNames', () => {
    it('should return an array of wave names', async () => {
      mockWaveRepository.find.mockResolvedValue([
        { waveName: 'Wave A' },
        { waveName: 'Wave B' },
      ]);

      const result = await service.getAllNames();

      expect(mockWaveRepository.find).toHaveBeenCalledWith({
        select: ['waveName'],
      });
      expect(result).toEqual(['Wave A', 'Wave B']);
    });
  });

  describe('getWaves', () => {
    it('should return all waves', async () => {
      mockWaveRepository.find.mockResolvedValue([mockWaveEntity]);

      const result = await service.getWaves();

      expect(mockWaveRepository.find).toHaveBeenCalledWith({
        relations: ['recipients'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockWaveEntity]);
    });
  });

  describe('getWavesMinimum', () => {
    it('should map standard waves to minimum DTOs and correctly assign recipient counts', async () => {
      mockWaveRepository.find.mockResolvedValue([mockWaveEntity]);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { waveId: 'wave-uuid-1', count: '5' },
      ]);

      const result = await service.getWavesMinimum();

      expect(mockWaveRecipientRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([
        {
          waveName: 'Test Wave',
          scheduledFrom: mockDateFrom.toISOString(),
          scheduledTo: mockDateTo.toISOString(),
          sameEmail: true,
          randomisedTimes: true,
          numberOfRecipients: 5,
        },
      ]);
    });

    it('should assign a count of 0 if the wave has no recipients mapping', async () => {
      mockWaveRepository.find.mockResolvedValue([mockWaveEntity]);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getWavesMinimum();

      expect(result[0].numberOfRecipients).toBe(0);
    });
  });

  describe('deleteWave', () => {
    it('should delete a wave and publish a wave.delete event', async () => {
      mockWaveRepository.findOne.mockResolvedValue(mockWaveEntity);
      mockWaveRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteWave('wave-uuid-1');

      expect(mockWaveRepository.delete).toHaveBeenCalledWith('wave-uuid-1');
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'wave-event-exchange',
        'wave.delete',
        { waveId: 'wave-uuid-1' },
      );
    });

    it('should throw NotFoundException if affected count is 0', async () => {
      mockWaveRepository.findOne.mockResolvedValue(null);
      mockWaveRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteWave('wave-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });
  });
});