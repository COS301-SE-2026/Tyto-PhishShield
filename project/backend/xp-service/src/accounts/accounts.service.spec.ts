import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { UserEntity } from '../entities/user.entity';
import { User } from '../dto/user.dto';
import { InternalServerErrorException } from '@nestjs/common';

const mockQueryBuilder = {
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  orUpdate: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const mockUserRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const user: User = {
      id: 'user-1',
      auth0Id: 'auth0|123',
      name: 'test',
      email: 'test@example.com',
      department: 'Engineering',
    };

    it('should upsert the user with the correct data', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      await service.createUser(user);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.into).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith({
        id: user.id,
        auth0Id: user.auth0Id,
        name: user.name,
        email: user.email,
        department: user.department,
      });
      expect(mockQueryBuilder.orUpdate).toHaveBeenCalledWith(
        ['name', 'email', 'department'],
        ['auth0Id'],
        { skipUpdateIfNoValuesChanged: true },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should return void on success', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      const result = await service.createUser(user);

      expect(result).toBeUndefined();
    });

    it('should propagate errors thrown by the repository', async () => {
      mockQueryBuilder.execute.mockRejectedValue(
        new Error('Failed to connect to the database'),
      );

      await expect(service.createUser(user)).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(service.createUser(user)).rejects.toThrow(
        'Failed to create or update user auth0|123',
      );
    });
  });
});
