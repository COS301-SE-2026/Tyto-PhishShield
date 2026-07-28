/**
 * Tests for {@link UsersService}
 *
 * Covers creation, lookups, updates, deletion, verification, and deactivation.
 * All repository interactions are mocked – no real database involved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole, Department } from './entities/user.entity';
import { EventProducerService } from '../event-producer/event-producer.service';
import  { NotFoundException } from '@nestjs/common';

const makeUser = (overrides = {}) =>
({  id: 'uuid-123',
  auth0Id: 'auth0|abc123',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
  isVerified: false,
  isActive: true,
  department: Department.IT_SECURITY,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
}) as User;


describe('UsersService', () => {
  let service: UsersService;
  let repo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock, remove: jest.Mock; update: jest.Mock };
  let eventProducer: jest.Mocked<EventProducerService>;
  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: EventProducerService, useValue: { publishUserCreatedEvent: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    eventProducer = module.get(EventProducerService);
  });

  afterEach(() => jest.clearAllMocks());

    describe('create', () => {
      it('saves the user and returns it', async () => {
        const user = makeUser();
        repo.create.mockReturnValue(user);
        repo.save.mockResolvedValue(user);
  
        const result = await service.create({
          auth0Id: 'auth0|abc123',
          email: 'test@example.com',
        });
  
        expect(repo.save).toHaveBeenCalled();
        expect(result).toEqual(user);
      });
  
      it('fires the user.created event after save', async () => {
        const user = makeUser();
        repo.create.mockReturnValue(user);
        repo.save.mockResolvedValue(user);
  
        await service.create({ auth0Id: 'auth0|abc123', email: 'x@y.com', department: Department.FINANCE });
  
        expect(eventProducer.publishUserCreatedEvent).toHaveBeenCalled();
      });
  
      it('handles a missing name (optional field)', async () => {
        const noName = makeUser({ name: undefined });
        repo.create.mockReturnValue(noName);
        repo.save.mockResolvedValue(noName);
  
        const result = await service.create({ auth0Id: 'abc', email: 'x@y.com' });
        expect(result.name).toBeUndefined();
      });
    });

      describe('findByAuth0Id', () => {
        it('returns the matching user', async () => {
          const user = makeUser();
          repo.findOne.mockResolvedValue(user);
          await expect(service.findByAuth0Id('auth0|abc123')).resolves.toEqual(user);
        });
    
        it('returns null when not found', async () => {
          repo.findOne.mockResolvedValue(null);
          await expect(service.findByAuth0Id('ghost')).resolves.toBeNull();
        });
      });

        describe('findByEmail', () => {
          it('finds user by email', async () => {
            const user = makeUser();
            repo.findOne.mockResolvedValue(user);
            const result = await service.findByEmail('test@example.com');
            expect(result).toBe(user);
          });
      
          it('returns null for unknown email', async () => {
            repo.findOne.mockResolvedValue(null);
            const result = await service.findByEmail('no@where.com');
            expect(result).toBeNull();
          });
        });

          describe('findAll', () => {
            it('returns all users', async () => {
              repo.find.mockResolvedValue([makeUser(), makeUser({ id: 'uuid-456' })]);
              const all = await service.findAll();
              expect(all).toHaveLength(2);
            });
        
            it('returns empty array when table is empty', async () => {
              repo.find.mockResolvedValue([]);
              expect(await service.findAll()).toEqual([]);
            });
          });

            describe('findById', () => {
              it('returns a user when id exists', async () => {
                repo.findOne.mockResolvedValue(makeUser());
                const user = await service.findById('uuid-123');
                expect(user.id).toBe('uuid-123');
              });
          
              it('throws NotFoundException for a missing id', async () => {
                repo.findOne.mockResolvedValue(null);
                await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
              });
            });
      
        describe('updateRole', () => {
          it('changes the role and saves', async () => {
            const user = makeUser({ role: UserRole.USER });
            repo.findOne.mockResolvedValue(user);
            repo.save.mockResolvedValue({ ...user, role: UserRole.ADMIN });
      
            const updated = await service.updateRole('uuid-123', UserRole.ADMIN);
            expect(updated.role).toBe(UserRole.ADMIN);
            expect(repo.save).toHaveBeenCalled();
          });
        });

        describe('updateProfile', () => {
          it('updates name and department', async () => {
            const user = makeUser();
            repo.findOne.mockResolvedValue(user);
            repo.save.mockResolvedValue({ ...user, name: 'New', department: Department.HR });
      
            const result = await service.updateProfile('auth0|abc123', {
              name: 'New',
              department: Department.HR,
            });
            expect(result.name).toBe('New');
            expect(result.department).toBe(Department.HR);
          });
      
          it('throws NotFoundException if user does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(
              service.updateProfile('bad-id', { name: 'X' }),
            ).rejects.toThrow(NotFoundException);
          });
        });

        describe('remove', () => {
          it('removes the user by id', async () => {
            repo.findOne.mockResolvedValue(makeUser());
            repo.remove.mockResolvedValue(undefined);
            await service.remove('uuid-123');
            expect(repo.remove).toHaveBeenCalled();
          });
      
          it('throws if user not found', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
          });
        });
      

          describe('removeByAuth0Id', () => {
            it('removes when user exists', async () => {
              repo.findOne.mockResolvedValue(makeUser());
              repo.remove.mockResolvedValue(undefined);
              await service.removeByAuth0Id('auth0|abc123');
              expect(repo.remove).toHaveBeenCalled();
            });
        
            it('does nothing if user already gone', async () => {
              repo.findOne.mockResolvedValue(null);
              await service.removeByAuth0Id('ghost');
              expect(repo.remove).not.toHaveBeenCalled();
            });
          });
        
            describe('markVerified', () => {
              it('sets isVerified = true', async () => {
                repo.update.mockResolvedValue({ affected: 1 } as any);
                await service.markVerified('auth0|abc123');
                expect(repo.update).toHaveBeenCalledWith(
                  { auth0Id: 'auth0|abc123' },
                  { isVerified: true },
                );
              });
            });


              describe('deactivate', () => {
                it('sets isActive = false', async () => {
                  repo.update.mockResolvedValue({ affected: 1 } as any);
                  await service.deactivate('uuid-123');
                  expect(repo.update).toHaveBeenCalledWith(
                    { id: 'uuid-123' },
                    { isActive: false },
                  );
                });
              });
});