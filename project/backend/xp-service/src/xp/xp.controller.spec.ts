import { Test, TestingModule } from '@nestjs/testing';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';
import { GiveXpDto } from '../dto/give-xp.dto';
import { XpReason } from '../entities/xp.entity';
import { Logger, NotFoundException } from '@nestjs/common';

const mockXpService = {
  giveXp: jest.fn(),
  getAllXp: jest.fn(),
  getNetXpAllUsers: jest.fn(),
  getXpByUser: jest.fn(),
  getNetXpByUser: jest.fn(),
};

describe('XpController', () => {
  let controller: XpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpController],
      providers: [{ provide: XpService, useValue: mockXpService }],
    }).compile();

    controller = module.get<XpController>(XpController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('eventGiveXp', () => {
    const dto: GiveXpDto = {
      auth0Id: 'auth0|123',
      amount: 50,
      reason: XpReason.QUIZ,
    };

    it('should delegate to xpService.giveXp', async () => {
      mockXpService.giveXp.mockResolvedValue({ id: 1 });
      await controller.eventGiveXp(dto);

      expect(mockXpService.giveXp).toHaveBeenCalledWith(dto);
    });

    it('should now throw error for NotFoundException', async () => {
      // We mock the Logger for the "warn" log
      // We temporarily change what Logger.prototype.warn does by using spyOn and mockRestore
      const mockLogger = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      mockXpService.giveXp.mockRejectedValue(
        new NotFoundException(`User ${dto.auth0Id} not found`),
      );

      await expect(controller.eventGiveXp(dto)).resolves.toBeUndefined();
      expect(mockLogger).toHaveBeenCalled();

      mockLogger.mockRestore();
    });

    it('should throw error since it is not NotFoundException', async () => {
      const error = new Error('unexpected failure');
      mockXpService.giveXp.mockRejectedValue(error);

      await expect(controller.eventGiveXp(dto)).rejects.toThrow(error);
    });
  });

  describe('giveXp', () => {
    it('should delegate to xpService.giveXp', async () => {
      const dto: GiveXpDto = {
        auth0Id: 'auth0|123',
        amount: 100,
        reason: XpReason.QUIZ,
      };
      const entry = { id: 1, userId: 1, amount: 100, reason: XpReason.QUIZ };
      mockXpService.giveXp.mockResolvedValue(entry);

      const result = await controller.giveXp(dto);

      expect(mockXpService.giveXp).toHaveBeenCalledWith(dto);
      expect(result).toBe(entry);
    });
  });

  describe('getAllXp', () => {
    it('should delegate to xpService.getAllXp', async () => {
      const entries = [{ id: 1 }, { id: 2 }];
      mockXpService.getAllXp.mockResolvedValue(entries);

      const result = await controller.getAllXp();

      expect(mockXpService.getAllXp).toHaveBeenCalled();
      expect(result).toBe(entries);
    });
  });

  describe('getNetXpAllUsers', () => {
    it('should delegate to xpService.getNetXpAllUsers', async () => {
      const entry = [
        {
          totalXp: 300,
          user: {
            auth0Id: 'auth0|123',
            name: 'Alice',
            email: 'alice@example.com',
            department: 'Test',
          },
        },
      ];
      mockXpService.getNetXpAllUsers.mockResolvedValue(entry);

      const result = await controller.getNetXpAllUsers();

      expect(mockXpService.getNetXpAllUsers).toHaveBeenCalled();
      expect(result).toBe(entry);
    });
  });

  describe('getXpByUser', () => {
    it('should delegate to xpService.getXpByUser with the auth0Id', async () => {
      const auth0Id = 'auth0|123';
      const entries = [{ id: 1, userId: 1, amount: 100 }];
      mockXpService.getXpByUser.mockResolvedValue(entries);

      const result = await controller.getXpByUser(auth0Id);

      expect(mockXpService.getXpByUser).toHaveBeenCalledWith(auth0Id);
      expect(result).toBe(entries);
    });
  });

  describe('getNetXpByUser', () => {
    it('should delegate to xpService.getNetXpByUser with the auth0Id', async () => {
      const auth0Id = 'auth0|123';
      const entry = {
        totalXp: 300,
        user: {
          auth0Id,
          name: 'Alice',
          email: 'alice@example.com',
          department: 'Test',
        },
      };
      mockXpService.getNetXpByUser.mockResolvedValue(entry);

      const result = await controller.getNetXpByUser(auth0Id);

      expect(mockXpService.getNetXpByUser).toHaveBeenCalledWith(auth0Id);
      expect(result).toBe(entry);
    });
  });
});
