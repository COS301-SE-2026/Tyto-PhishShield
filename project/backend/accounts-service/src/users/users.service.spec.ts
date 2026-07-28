import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { EventProducerService } from '../event-producer/event-producer.service';

const mockUser: User = {
  id: 'uuid-123',
  auth0Id: 'auth0|abc123',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: EventProducerService, useValue: { publishUserCreatedEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create()', () => {
    it('should create and save a user', async () => {
      repo.create.mockReturnValue(mockUser);
      repo.save.mockResolvedValue(mockUser);

      const result = await service.create({
        auth0Id: 'auth0|abc123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ auth0Id: 'auth0|abc123', email: 'test@example.com' }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should create a user without an optional name', async () => {
      const noName = { ...mockUser, name: undefined };
      repo.create.mockReturnValue(noName);
      repo.save.mockResolvedValue(noName);

      const result = await service.create({ auth0Id: 'auth0|abc123', email: 'test@example.com' });

      expect(result.name).toBeUndefined();
    });
  });

  describe('findByAuth0Id()', () => {
    it('should return a user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByAuth0Id('auth0|abc123');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|abc123' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findByAuth0Id('auth0|nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('should return a user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      expect(await service.findByEmail('ghost@example.com')).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return all users', async () => {
      repo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no users exist', async () => {
      repo.find.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });
});