import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { XpService } from './xp.service';
import { XpEntity, XpReason } from '../entities/xp.entity';
import { Department, UserEntity } from '../entities/user.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const mockUser: Partial<UserEntity> = {
  id: '1',
  auth0Id: 'auth0|123',
  name: 'Alice',
  email: 'test@example.com',
  department: Department.FINANCE,
};
const mockXpEntry: Partial<XpEntity> = {
  id: '1',
  userId: '1',
  amount: 100,
  reason: XpReason.QUIZ,
};

const mockXpEntryWithUser: Partial<XpEntity> = {
  ...mockXpEntry,
  user: mockUser as UserEntity,
};

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
};

const mockXpRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockUserRepository = {
  findOneBy: jest.fn(),
};

describe('XpService', () => {
  let service: XpService;

  const mockAmqpConnection = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpService,
        { provide: getRepositoryToken(XpEntity), useValue: mockXpRepository },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<XpService>(XpService);

    jest.clearAllMocks();
    mockXpRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.addSelect.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.innerJoin.mockReturnThis();
    mockQueryBuilder.groupBy.mockReturnThis();
    mockQueryBuilder.addGroupBy.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('giveXp', () => {
    const dto = { auth0Id: 'auth0|123', amount: 100, reason: XpReason.QUIZ };

    it('should create and save an xp entry for an existing user', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockXpRepository.create.mockReturnValue(mockXpEntry);
      mockXpRepository.save.mockResolvedValue(mockXpEntry);

      const result = await service.giveXp(dto);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        auth0Id: dto.auth0Id,
      });
      expect(mockXpRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        amount: dto.amount,
        reason: dto.reason,
      });
      expect(mockXpRepository.save).toHaveBeenCalledWith(mockXpEntry);
      expect(result).toBe(mockXpEntry);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.giveXp(dto)).rejects.toThrow(NotFoundException);
      expect(mockXpRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when saving fails', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockXpRepository.create.mockResolvedValue(mockXpEntry);
      mockXpRepository.save.mockRejectedValue(new Error('db unavailable'));
      await expect(service.giveXp(dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });

    it('should save entry when publishing xp.given event fails', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockXpRepository.create.mockReturnValue(mockXpEntry);
      mockXpRepository.save.mockResolvedValue(mockXpEntry);
      mockAmqpConnection.publish.mockRejectedValue(new Error('broker down'));

      const result = await service.giveXp(dto);

      expect(result).toBe(mockXpEntry);
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'xp-event-exchange',
        'xp.given',
        { auth0Id: mockUser.auth0Id, amount: dto.amount, reason: dto.reason },
      );
    });
  });

  describe('getAllXp', () => {
    it('should return all xp entries ordered by createdAt DESC', async () => {
      mockXpRepository.find.mockResolvedValue([mockXpEntryWithUser]);

      const result = await service.getAllXp();

      expect(mockXpRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
      expect(result).toEqual([
        {
          id: mockXpEntry.id,
          amount: mockXpEntry.amount,
          reason: mockXpEntry.reason,
          createdAt: mockXpEntry.createdAt,
          user: {
            auth0Id: mockUser.auth0Id,
            name: mockUser.name,
            email: mockUser.email,
            department: mockUser.department,
          },
        },
      ]);
    });
  });

  describe('getXpByUser', () => {
    it('should return xp entries for an existing user', async () => {
      const entries = [mockXpEntry];
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockXpRepository.find.mockResolvedValue(entries);

      const result = await service.getXpByUser('auth0|123');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        auth0Id: 'auth0|123',
      });
      expect(mockXpRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([
        {
          id: mockXpEntry.id,
          amount: mockXpEntry.amount,
          reason: mockXpEntry.reason,
          createdAt: mockXpEntry.createdAt,
          user: {
            auth0Id: mockUser.auth0Id,
            name: mockUser.name,
            email: mockUser.email,
            department: mockUser.department,
          },
        },
      ]);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getXpByUser('auth0|unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getNetXpByUser', () => {
    it('should return totalXp for an existing user', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockQueryBuilder.getRawOne.mockResolvedValue({ totalXp: '250' });

      const result = await service.getNetXpByUser('auth0|123');

      expect(result).toEqual({
        totalXp: 250,
        user: {
          auth0Id: mockUser.auth0Id,
          name: mockUser.name,
          email: mockUser.email,
          department: mockUser.department,
        },
      });
    });

    it('should return 0 when the query returns null (user has no xp)', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getNetXpByUser('auth0|123');

      expect(result).toEqual({
        totalXp: 0,
        user: {
          auth0Id: mockUser.auth0Id,
          name: mockUser.name,
          email: mockUser.email,
          department: mockUser.department,
        },
      });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getNetXpByUser('auth0|unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockQueryBuilder.getRawOne.mockRejectedValue(new Error('db unavailable'));

      await expect(service.getNetXpByUser('auth0|123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getNetXpAllUsers', () => {
    it('should return all users with totalXp cast to a number', async () => {
      const rawRows = [
        {
          auth0Id: 'auth0|123',
          name: 'Alice',
          email: 'alice@example.com',
          department: Department.FINANCE,
          totalXp: '300',
        },
        {
          auth0Id: 'auth0|456',
          name: 'Bob',
          email: 'bob@example.com',
          department: Department.FINANCE,
          totalXp: '150',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getNetXpAllUsers();

      expect(result).toEqual([
        {
          totalXp: 300,
          user: {
            auth0Id: 'auth0|123',
            name: 'Alice',
            email: 'alice@example.com',
            department: Department.FINANCE,
          },
        },
        {
          totalXp: 150,
          user: {
            auth0Id: 'auth0|456',
            name: 'Bob',
            email: 'bob@example.com',
            department: Department.FINANCE,
          },
        },
      ]);
    });

    it('should return empty array when no users have xp', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getNetXpAllUsers();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException when the query fails', async () => {
      mockQueryBuilder.getRawMany.mockRejectedValue(
        new Error('db unavailable'),
      );

      await expect(service.getNetXpAllUsers()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
