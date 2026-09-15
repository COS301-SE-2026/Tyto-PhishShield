import { Test, TestingModule } from '@nestjs/testing';
import { WaveController } from './wave.controller';
import { WaveService } from './wave.service';
import { WaveDto } from '../dto/wave.dto';
import { WaveMinimumDto } from '../dto/wave-minimum.dto';
import { WaveEntity } from '../entities/wave.entity';

describe('WaveController', () => {
  let controller: WaveController;
  let service: WaveService;

  const mockWaveService = {
    getAllNames: jest.fn(),
    getWavesMinimum: jest.fn(),
    getWavesWithAuth0Id: jest.fn(),
    getWaves: jest.fn(),
    getWaveWithId: jest.fn(),
    saveWave: jest.fn(),
    deleteWave: jest.fn(),
  };

  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockAuth0Id = 'auth0|test-user';

  const mockWaveEntity = {
    id: mockUuid,
    waveName: 'Test Name',
    scheduledFrom: '2026-09-01T08:00:00.000Z',
    scheduledTo: '2026-09-05T17:00:00.000Z',
    sameEmail: true,
    randomisedTimes: true,
    recipients: [],
  } as unknown as WaveEntity;

  const mockWaveMinimum: WaveMinimumDto = {
    waveName: 'Test Name',
    scheduledFrom: '2026-09-01T08:00:00.000Z',
    scheduledTo: '2026-09-05T17:00:00.000Z',
    sameEmail: true,
    randomisedTimes: true,
    numberOfRecipients: 15,
  };

  const mockWaveDto: WaveDto = {
    waveName: 'Test Name',
    scheduledFrom: '2026-09-01T08:00:00.000Z',
    scheduledTo: '2026-09-05T17:00:00.000Z',
    sameEmail: true,
    randomisedTimes: true,
    recipients: [
      {
        auth0Id: mockAuth0Id,
        referenceNumber: 'PHISH-001',
        emailId: 'email-uuid-123',
        scheduledAt: new Date('2026-09-02T10:00:00.000Z'),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaveController],
      providers: [
        {
          provide: WaveService,
          useValue: mockWaveService,
        },
      ],
    }).compile();

    controller = module.get<WaveController>(WaveController);
    service = module.get<WaveService>(WaveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllNames', () => {
    it('should return an array of wave names', async () => {
      const expectedNames = ['Wave 1', 'Wave 2'];
      mockWaveService.getAllNames.mockResolvedValue(expectedNames);

      const result = await controller.getAllNames();

      expect(service.getAllNames).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedNames);
    });
  });

  describe('getWavesMinimum', () => {
    it('should return minimum wave data', async () => {
      const expectedData = [mockWaveMinimum];
      mockWaveService.getWavesMinimum.mockResolvedValue(expectedData);

      const result = await controller.getWavesMinimum();

      expect(service.getWavesMinimum).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedData);
    });
  });

  describe('getWavesWithAuth0Id', () => {
    it('should return waves associated with a specific auth0Id', async () => {
      const expectedData = [mockWaveEntity];
      mockWaveService.getWavesWithAuth0Id.mockResolvedValue(expectedData);

      const result = await controller.getWavesWithAuth0Id(mockAuth0Id);

      expect(service.getWavesWithAuth0Id).toHaveBeenCalledWith(mockAuth0Id);
      expect(result).toEqual(expectedData);
    });
  });

  describe('getWaves', () => {
    it('should return all waves', async () => {
      const expectedData = [mockWaveEntity];
      mockWaveService.getWaves.mockResolvedValue(expectedData);

      const result = await controller.getWaves();

      expect(service.getWaves).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedData);
    });
  });

  describe('getWaveWithId', () => {
    it('should return a single wave by id', async () => {
      mockWaveService.getWaveWithId.mockResolvedValue(mockWaveEntity);

      const result = await controller.getWaveWithId(mockUuid);

      expect(service.getWaveWithId).toHaveBeenCalledWith(mockUuid);
      expect(result).toEqual(mockWaveEntity);
    });
  });

  describe('saveWave', () => {
    it('should pass the dto to the service and return the saved wave entity', async () => {
      mockWaveService.saveWave.mockResolvedValue(mockWaveEntity);

      const result = await controller.saveWave(mockWaveDto);

      expect(service.saveWave).toHaveBeenCalledWith(mockWaveDto);
      expect(result).toEqual(mockWaveEntity);
    });
  });

  describe('deleteWave', () => {
    it('should call the service to delete a wave by id', async () => {
      mockWaveService.deleteWave.mockResolvedValue(undefined);

      await controller.deleteWave(mockUuid);

      expect(service.deleteWave).toHaveBeenCalledWith(mockUuid);
    });
  });
});