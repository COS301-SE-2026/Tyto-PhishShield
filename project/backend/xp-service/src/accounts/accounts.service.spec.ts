import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { UserEntity } from '../entities/user.entity';
import { User } from '../dto/user.dto';

const mockUserRepository = {
  upsert: jest.fn(),
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

    it('should upsert the user with the correct data and conflict config', async () => {
      mockUserRepository.upsert.mockResolvedValue(undefined);

      await service.createUser(user);

      expect(mockUserRepository.upsert).toHaveBeenCalledWith(
        {
          id: user.id,
          auth0Id: user.auth0Id,
          name: user.name,
          email: user.email,
          department: user.department,
        },
        { conflictPaths: ['auth0Id'], skipUpdateIfNoValuesChanged: true },
      );
    });

    it('should return void on success', async () => {
      mockUserRepository.upsert.mockResolvedValue(undefined);

      const result = await service.createUser(user);

      expect(result).toBeUndefined();
    });

    it('should propagate errors thrown by the repository', async () => {
      mockUserRepository.upsert.mockRejectedValue(
        new Error('Failed to create or update user auth0|123'),
      );

      await expect(service.createUser(user)).rejects.toThrow(
        'Failed to create or update user auth0|123',
      );
    });
  });
});
