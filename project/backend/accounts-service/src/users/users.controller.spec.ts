/**
 * Tests for {@link UsersController}
 *
 * Verifies role‑based access, user lookups, role updates, and deactivation.
 * All service calls are mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { UserRole, Department } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const makeUser = (overrides = {}) =>
  ({
    id: 'uuid-1',
    auth0Id: 'auth0|abc123',
    email: 'user@test.com',
    name: 'Test User',
    role: UserRole.USER,
    isVerified: true,
    isActive: true,
    department: Department.IT_SECURITY,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as any;

const makeReq = (userOverrides = {}) =>
  ({
    user: {
      auth0Id: 'auth0|abc123',
      email: 'user@test.com',
      role: UserRole.USER,
      name: 'Test User',
      ...userOverrides,
    },
  }) as any;

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            updateRole: jest.fn(),
            deactivate: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {}, // not directly called, but needed for injection
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

    describe('findAll', () => {
      it('returns all users (admin/analyst only)', async () => {
        const users = [makeUser(), makeUser({ id: 'uuid-2', email: 'b@test.com' })];
        usersService.findAll.mockResolvedValue(users);
  
        const result = await controller.findAll();
        expect(result).toHaveLength(2);
        expect(usersService.findAll).toHaveBeenCalled();
      });
  
      it('returns empty array when no users exist', async () => {
        usersService.findAll.mockResolvedValue([]);
        const result = await controller.findAll();
        expect(result).toEqual([]);
      });
    });

      describe('findOne', () => {
        it('returns the user if admin requests any user', async () => {
          const adminReq = makeReq({ role: UserRole.ADMIN, auth0Id: 'auth0|admin' });
          const targetUser = makeUser({ id: 'uuid-3', auth0Id: 'auth0|other' });
          usersService.findById.mockResolvedValue(targetUser);
    
          const result = await controller.findOne('uuid-3', adminReq);
          expect(result).toEqual(targetUser);
        });
    
        it('returns the user if the same user requests themselves', async () => {
          const req = makeReq();
          const user = makeUser({ auth0Id: 'auth0|abc123' });
          usersService.findById.mockResolvedValue(user);
    
          const result = await controller.findOne('uuid-1', req);
          expect(result).toEqual(user);
        });
    
        it('blocks a regular user from viewing another user', async () => {
          const req = makeReq({ auth0Id: 'auth0|abc123' }); // regular user
          const otherUser = makeUser({ auth0Id: 'auth0|other' });
          usersService.findById.mockResolvedValue(otherUser);
    
          const result = await controller.findOne('uuid-other', req);
          expect(result).toEqual({ message: 'Not Allowed' });
        });
    
        it('throws NotFoundException if user does not exist', async () => {
          usersService.findById.mockRejectedValue(new NotFoundException());
          await expect(controller.findOne('bad-id', makeReq())).rejects.toThrow(
            NotFoundException,
          );
        });
      });
    // make sure this works, important for report service as well bababoom.

        describe('updateRole', () => {
          it('calls usersService.updateRole with correct parameters', async () => {
            const updatedUser = makeUser({ role: UserRole.ADMIN });
            usersService.updateRole.mockResolvedValue(updatedUser);
      
            const result = await controller.updateRole('uuid-1', { role: UserRole.ADMIN });
            expect(usersService.updateRole).toHaveBeenCalledWith('uuid-1', UserRole.ADMIN);
            expect(result.role).toBe(UserRole.ADMIN);
          });
        });

          describe('remove', () => {
            it('calls usersService.deactivate and returns nothing', async () => {
              usersService.deactivate.mockResolvedValue(undefined);
              await controller.remove('uuid-1');
              expect(usersService.deactivate).toHaveBeenCalledWith('uuid-1');
            });
        
            it('propagates errors from service', async () => {
              usersService.deactivate.mockRejectedValue(new NotFoundException());
              await expect(controller.remove('bad-id')).rejects.toThrow(NotFoundException);
            });//dont know if this is needed, but feels good to add.
          });
        });