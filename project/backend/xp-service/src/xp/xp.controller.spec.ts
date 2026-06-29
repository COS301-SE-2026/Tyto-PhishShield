import { Test, TestingModule } from '@nestjs/testing';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';
import { GiveXpDto } from '../dto/give-xp.dto';
import { XpReason } from '../entities/xp.entity';

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

  describe('giveXp', () => {
    it('should delegate to xpService.giveXp and return the result', async () => {
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
    it('should delegate to xpService.getAllXp and return the result', async () => {
      const entries = [{ id: 1 }, { id: 2 }];
      mockXpService.getAllXp.mockResolvedValue(entries);

      const result = await controller.getAllXp();

      expect(mockXpService.getAllXp).toHaveBeenCalled();
      expect(result).toBe(entries);
    });
  });

  describe('getNetXpAllUsers', () => {
    it('should delegate to xpService.getNetXpAllUsers and return the result', async () => {
      const leaderboard = [{ auth0Id: 'auth0|123', totalXp: 300 }];
      mockXpService.getNetXpAllUsers.mockResolvedValue(leaderboard);

      const result = await controller.getNetXpAllUsers();

      expect(mockXpService.getNetXpAllUsers).toHaveBeenCalled();
      expect(result).toBe(leaderboard);
    });
  });

  describe('getXpByUser', () => {
    it('should delegate to xpService.getXpByUser with the auth0Id and return the result', async () => {
      const auth0Id = 'auth0|123';
      const entries = [{ id: 1, userId: 1, amount: 100 }];
      mockXpService.getXpByUser.mockResolvedValue(entries);

      const result = await controller.getXpByUser(auth0Id);

      expect(mockXpService.getXpByUser).toHaveBeenCalledWith(auth0Id);
      expect(result).toBe(entries);
    });
  });

  describe('getNetXpByUser', () => {
    it('should delegate to xpService.getNetXpByUser with the auth0Id and return the result', async () => {
      const auth0Id = 'auth0|123';
      const summary = { auth0Id, totalXp: 300 };
      mockXpService.getNetXpByUser.mockResolvedValue(summary);

      const result = await controller.getNetXpByUser(auth0Id);

      expect(mockXpService.getNetXpByUser).toHaveBeenCalledWith(auth0Id);
      expect(result).toBe(summary);
    });
  });
});
