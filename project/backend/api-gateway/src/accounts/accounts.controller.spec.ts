import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ProxyService } from '../proxy/proxy.service';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import { AccountsService } from './accounts.service';
import { LoginDto } from '../dto/login.dto';
import { RouteResolver } from '../proxy/proxy.routes';

describe('AccountsController', () => {
  let controller: AccountsController;
  let proxyService: jest.Mocked<ProxyService>;
  let accountsService: jest.Mocked<AccountsService>;

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
              if (key === 'AUTH0_DOMAIN') return 'Domain';
              return defaultValue;
            }),
            getOrThrow: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'ACCOUNTS_SERVICE_URL') return 'http://accounts-service:3002';
              if (key === 'AUTH0_DOMAIN') return 'Domain';
              return defaultValue;
            }),
          },
        },
        { 
          provide: AccountsService, useValue: { 
            login: jest.fn(), 
            updateEmployeeAsRegistered: jest.fn(), 
            validateEmployeeId: jest.fn((employeeId: string, employeeEmail: string) => {
              if (employeeId === '1' && employeeEmail === 'test@example.com') {
                return true;
              }
              return false;
            })
          } 
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    proxyService = module.get(ProxyService);
    accountsService = module.get(AccountsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ===========================================================================
  // Use Case 1: Register
  // ===========================================================================

  describe('register()', () => {
    const body = { email: 'test@example.com', password: 'Password123!', name: 'Test User', employeeId: '1' };
    it('should forward the request to the accounts service and return the result', async () => {
      const body = { email: 'test@example.com', password: 'Password123!', name: 'Test User', employeeId: '1' };
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
        controller.register(body),
      ).rejects.toThrow(HttpException);
    });

    it('should propagate InternalServerErrorException when service is unreachable', async () => {
      proxyService.forward.mockRejectedValue(new Error('Could not reach downstream service'));

      await expect(
        controller.register(body),
      ).rejects.toThrow('Could not reach downstream service');
    });
  });

  // ===========================================================================
  // Use Case 2: Login
  // ===========================================================================

  describe('login()', () => {
    it('Expect login function from accounts service to be called', async () => {
      const loginDto: LoginDto = {
        email: 'test email',
        password: 'test password'
      }

      try {
        await controller.login(loginDto);
      } catch {

      }

      expect(accountsService.login).toHaveBeenCalledWith(loginDto);
    })
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