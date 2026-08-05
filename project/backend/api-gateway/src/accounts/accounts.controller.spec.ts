import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ProxyService } from '../proxy/proxy.service';
import { RouteResolver } from '../proxy/proxy.routes';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import type { Request, Response } from 'express';

describe('AccountsController', () => {
  let controller: AccountsController;
  let proxyService: jest.Mocked<ProxyService>;
  let routeResolver: jest.Mocked<RouteResolver>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        { provide: ProxyService, useValue: { forward: jest.fn(), beterForward: jest.fn() } },
        { provide: RouteResolver, useValue: { resolve: jest.fn() } },
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
    routeResolver = module.get(RouteResolver);
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
    it('should proxy the login request using the resolved route', () => {
      const req = {
        originalUrl: '/api/accounts/auth/login',
        url: '/api/accounts/auth/login',
      } as unknown as Request;
      const res = {} as Response;
      const route = {
        apiRoute: '/api/accounts',
        targetService: 'http://accounts-service:3002/api',
      };
      routeResolver.resolve.mockReturnValue(route);

      controller.login(req, res);

      expect(routeResolver.resolve).toHaveBeenCalledWith('/api/accounts/auth/login');
      expect(req.url).toBe('/auth/login');
      expect(proxyService.beterForward).toHaveBeenCalledWith(
        req,
        res,
        'http://accounts-service:3002/api',
      );
    });

    it('should propogate errors from route resolver', async () => {
      const req = {
        originalUrl: '/api/accounts/auth/login',
        url: '/api/accounts/auth/login',
      } as unknown as Request;
      const res = {} as Response;

      routeResolver.resolve.mockImplementation(() => {
        throw new Error('Unknown route');
      })

      expect(() => controller.login(req, res)).toThrow('Unknown route');
    });
  });

  // ===========================================================================
  // Use Case 3: Get Profile
  // ===========================================================================

  describe('getMe()', () => {
    it('should proxy the request to the accounts service with the auth header', async () => {
      const mockUser: GatewayUser = {
        auth0Id: 'auth0|abc123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq = {
        user: mockUser,
        headers: {
          authorization: 'Bearer test-token',
        },
      };
      const expectedResponse = { ...mockUser };
      proxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.getMe(mockReq as never);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://accounts-service:3002/api/auth/me',
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return the correct role for admin users', async () => {
      const adminUser: GatewayUser = {
        auth0Id: 'auth0|admin',
        email: 'admin@example.com',
        role: 'admin',
      };
      const mockReq = {
        user: adminUser,
        headers: {
          authorization: 'Bearer admin-token',
        },
      };
      const expectedResponse = { ...adminUser };
      proxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.getMe(mockReq as never);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://accounts-service:3002/api/auth/me',
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect((result as GatewayUser).role).toBe('admin');
    });
  });
});