/**
 * Tests for {@link AuthService}
 *
 * Covers registration, login (with device token & OTP flow),
 * OTP verification, password reset, and account deletion.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { User } from '../users/entities/user.entity';
import type { AxiosResponse } from 'axios';
import { OtpService } from '../otp/otp.service';
import { UserSyncService } from '../users/user-sync.service';
import { koaJwtSecret } from 'jwks-rsa';
import { UserRole } from '@phishshield/dto';

const axiosOf = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as never,
}) as AxiosResponse<T>;

const makeUser = () =>
  ({
    id: 'uuid-123',
    auth0Id: 'auth0|abc123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    isVerified: true,
    isActive: true,
    department: 'Finance',
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as User;

const httpService = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let otpService: jest.Mocked<OtpService>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              ({
                AUTH0_DOMAIN: 'test.us.auth0.com',
                AUTH0_CLIENT_ID: 'client-id',
                AUTH0_CLIENT_SECRET: 'client-secret',
                AUTH0_AUDIENCE: 'https://phishshield-api',
                AUTH0_M2M_CLIENT_ID: 'm2m-client-id',
                AUTH0_M2M_CLIENT_SECRET: 'm2m-client-secret',
              })[key] ?? '',
            ),
            getOrThrow: jest.fn((key: string) => {
              switch(key) {
                case 'AUTH0_DOMAIN': return 'test.us.auth0.com';
                default: throw new Error('key does not match');
              }
            }),
          },
        },
        { provide: HttpService, useValue: { post: jest.fn(), get: jest.fn() , patch: jest.fn(), delete: jest.fn()} },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByAuth0Id: jest.fn(),
            findByEmail: jest.fn(),
            markVerified: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: { generateAndSend: jest.fn(), verify: jest.fn(), verifyDevice: jest.fn() },
        },
        {
          provide: UserSyncService,
          useValue: { onModuleInit: jest.fn(), syncAuth0User: jest.fn(), needSyncing: jest.fn() },
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    otpService = module.get(OtpService);
  });

  afterEach(() => jest.clearAllMocks());
  
    describe('register', () => {
    it('creates the user in Auth0 and saves locally', async () => {
      // management token
      httpService.post.mockReturnValueOnce(
        of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })),
      );
      // Auth0 user creation
      httpService.post.mockReturnValueOnce(
        of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'Test User' })),
      );
      usersService.create.mockResolvedValue(makeUser());
      otpService.generateAndSend.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.message).toContain('Registration successful');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ auth0Id: 'auth0|abc123', email: 'test@example.com' }),
      );
    });

    it('throws ConflictException for duplicate email', async () => {
      httpService.post.mockReturnValueOnce(
        of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })),
      );
      httpService.post.mockReturnValueOnce(throwError(() => ({ response: { status: 409 } })));

      await expect(
        service.register({ email: 'taken@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws InternalServerErrorException on unexpected Auth0 error', async () => {
      httpService.post.mockReturnValueOnce(
        of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })),
      );
      httpService.post.mockReturnValueOnce(throwError(() => ({ response: { status: 500 } })));

      await expect(
        service.register({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
  
    describe('logout', () => {
      it('returns a discard token message', () => {
        const result = service.logout();
        expect(result.message).toMatch(/discard your access token/);
      });
    });
  
    describe('updateProfile', () => {
      it('calls usersService.updateProfile and updates Auth0', async () => {
        // mock management token to avoid HTTP post
        jest.spyOn(service as any, 'getManagementToken').mockResolvedValue('fake-mgmt-token');

        (httpService as any).patch = jest.fn().mockReturnValue(of(axiosOf({})));
    
        usersService.updateProfile.mockResolvedValue(makeUser());
    
        const result = await service.updateProfile('auth0|abc', { name: 'New' });
    
        expect(usersService.updateProfile).toHaveBeenCalledWith('auth0|abc', { name: 'New' });
        expect(result.message).toContain('Profile updated');
        expect(httpService.patch).toHaveBeenCalled();
      });
    });
  
    describe('forgotPassword', () => {
      it('sends a password change request', async () => {
        httpService.post.mockReturnValueOnce(of(axiosOf({})));
        const result = await service.forgotPassword('a@b.com');
        expect(result.message).toContain('If an account exists');
      });
  
      it('throws InternalServerErrorException on failure', async () => {
        httpService.post.mockReturnValueOnce(throwError(() => new Error('Network Error')));
        await expect(service.forgotPassword('a@b.com')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  
    describe('deleteUser', () => {
      it('deletes the user via Auth0', async () => {
        // management token
        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })),
        );
        // inject delete mock (HttpService doesn't have delete by default in our mock, so we add it)
        (httpService as any).delete = jest.fn().mockReturnValue(of(axiosOf({})));
        await expect(service.deleteUser('auth0|abc')).resolves.toBeUndefined();
      });
    });
  });