import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ProxyService } from '../proxy/proxy.service';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

describe('AccountsController', () => {
  let controller: AccountsController;
  let proxyService: jest.Mocked<ProxyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        { provide: ProxyService, useValue: { forward: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'ACCOUNTS_SERVICE_URL') return 'http://accounts-service:3002';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => jest.clearAllMocks());

  // ===========================================================================
  // Use Case 1: Register
  // ===========================================================================

  describe('register()', () => {
    it('should forward the request to the accounts service and return the result', async () => {
      const body = { email: 'test@example.com', password: 'Password123!', name: 'Test User' };
      const expected = { message: 'Registration successful', userId: 'uuid-123' };
      proxyService.forward.mockResolvedValue(expected);

      const result = await controller.register(body);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://accounts-service:3002/api/auth/register',
        method: 'POST',
        data: body,
      });
      expect(result).toEqual(expected);
    });

    it('should propagate 409 HttpException from ProxyService', async () => {
      proxyService.forward.mockRejectedValue(new HttpException('Conflict', 409));

      await expect(
        controller.register({ email: 'taken@example.com', password: 'Password123!' }),
      ).rejects.toThrow(HttpException);
    });

    it('should propagate InternalServerErrorException when service is unreachable', async () => {
      proxyService.forward.mockRejectedValue(new Error('Could not reach downstream service'));

      await expect(
        controller.register({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow('Could not reach downstream service');
    });
  });

  // ===========================================================================
  // Use Case 2: Login
  // ===========================================================================

  describe('login()', () => {
    it('should forward login request and return the token', async () => {
      const body = { email: 'test@example.com', password: 'Password123!' };
      const expected = { access_token: 'jwt-token', expires_in: 86400 };
      proxyService.forward.mockResolvedValue(expected);

      const result = await controller.login(body);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://accounts-service:3002/api/auth/login',
        method: 'POST',
        data: body,
      });
      expect(result).toEqual(expected);
    });

    it('should propagate 401 HttpException on invalid credentials', async () => {
      proxyService.forward.mockRejectedValue(new HttpException('Unauthorized', 401));

      await expect(
        controller.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(HttpException);
    });
  });

  // ===========================================================================
  // Use Case 3: Get Profile
  // ===========================================================================

  describe('getMe()', () => {
    it('should return the user from req.user', () => {
      const mockUser: GatewayUser = {
        auth0Id: 'auth0|abc123',
        email: 'test@example.com',
        role: 'user',
      };

      expect(controller.getMe({ user: mockUser } as never)).toEqual(mockUser);
    });

    it('should return the correct role for admin users', () => {
      const adminUser: GatewayUser = {
        auth0Id: 'auth0|admin',
        email: 'admin@example.com',
        role: 'admin',
      };

      expect(controller.getMe({ user: adminUser } as never).role).toBe('admin');
    });
  });
});