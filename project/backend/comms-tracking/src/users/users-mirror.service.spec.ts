/**
 * Unit tests for UsersMirrorService.
 *
 * Ensures upserts don't clobber a previously-mapped slackId,
 * and that deletions are soft (isActive flag).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersMirrorService } from './users-mirror.service';
import { CommsUser } from '../comms/entities/comms-user.entity';

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('UsersMirrorService', () => {
  let service: UsersMirrorService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersMirrorService,
        { provide: getRepositoryToken(CommsUser), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(UsersMirrorService);
  });

  describe('upsertUser', () => {
    it('creates a new user when none exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ auth0Id: 'auth0|new' } as any);
      mockUserRepo.save.mockResolvedValue({} as any);

      await service.upsertUser({
        auth0Id: 'auth0|new',
        email: 'new@example.com',
        name: 'New',
        department: 'Finance',
      });

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        auth0Id: 'auth0|new',
        email: 'new@example.com',
        name: 'New',
        department: 'Finance',
        isActive: true,
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('updates an existing user and preserves their slackId', async () => {
      const existing = {
        auth0Id: 'auth0|alice',
        slackId: 'U123',
        email: 'old@example.com',
        name: 'Old',
        department: 'IT',
      };
      mockUserRepo.findOne.mockResolvedValue(existing as any);
      mockUserRepo.save.mockResolvedValue(existing as any);

      await service.upsertUser({
        auth0Id: 'auth0|alice',
        email: 'new@example.com',
        name: 'New',
        department: 'Finance',
      });

      // slackId must survive the update
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          auth0Id: 'auth0|alice',
          slackId: 'U123',
          email: 'new@example.com',
          name: 'New',
          department: 'Finance',
        }),
      );
    });

    it('keeps the existing email when the update omits it', async () => {
      const existing = {
        auth0Id: 'auth0|alice',
        email: 'kept@example.com',
        name: 'Old',
      };
      mockUserRepo.findOne.mockResolvedValue(existing as any);
      mockUserRepo.save.mockResolvedValue(existing as any);

      await service.upsertUser({ auth0Id: 'auth0|alice', name: 'New' });

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'kept@example.com',
          name: 'New',
        }),
      );
    });
  });

  describe('markDeleted', () => {
    it('soft-deletes by flipping isActive', async () => {
      mockUserRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.markDeleted('auth0|ghost');

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        { auth0Id: 'auth0|ghost' },
        { isActive: false },
      );
    });
  });
});