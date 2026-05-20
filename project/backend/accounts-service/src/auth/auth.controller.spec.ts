import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { register: jest.fn(), login: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ===========================================================================
  // Use Case 1: Registration
  // ===========================================================================

  describe('register()', () => {
    it('should return success message from service', async () => {
      authService.register.mockResolvedValue({ message: 'Registration successful', userId: 'uuid-123' });

      const result = await controller.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result).toEqual({ message: 'Registration successful', userId: 'uuid-123' });
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('should propagate ConflictException from service', async () => {
      authService.register.mockRejectedValue(new ConflictException());

      await expect(
        controller.register({ email: 'taken@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate InternalServerErrorException from service', async () => {
      authService.register.mockRejectedValue(new Error('Auth0 unavailable'));

      await expect(
        controller.register({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow('Auth0 unavailable');
    });
  });

  // ===========================================================================
  // Use Case 2: Login
  // ===========================================================================

  describe('login()', () => {
    it('should return access token from service', async () => {
      authService.login.mockResolvedValue({ access_token: 'jwt-token', expires_in: 86400 });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual({ access_token: 'jwt-token', expires_in: 86400 });
    });

    it('should propagate UnauthorizedException from service', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException());

      await expect(
        controller.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================================
  // Use Case 3: Get Profile
  // ===========================================================================

  describe('getProfile()', () => {
    it('should return the user from req.user', () => {
      const mockUser: AuthenticatedUser = {
        auth0Id: 'auth0|abc123',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      const result = controller.getProfile({ user: mockUser } as never);

      expect(result).toEqual(mockUser);
    });

    it('should return the correct role', () => {
      const adminUser: AuthenticatedUser = {
        auth0Id: 'auth0|admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const result = controller.getProfile({ user: adminUser } as never);

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });
});