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

const makeUser = (overrides = {}) => 
({  id: 'uuid-123',
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

describe('AuthService', () => {
  let service: AuthService;
  let httpService: jest.Mocked<HttpService>;
  let usersService: jest.Mocked<UsersService>;
  let userSyncService: jest.Mocked<UserSyncService>;
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
    httpService = module.get(HttpService);
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

   describe('login', () => {
      const validDto = { email: 'test@example.com', password: 'Password123!' };
  
      beforeEach(() => {
        // Management token – used inside getAuth0UserByEmail
        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })),
        );
      });
  
      it('returns access token when everything is fine', async () => {
        // getAuth0UserByEmail returns a verified user
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: true }])),
        );
        usersService.findByAuth0Id.mockResolvedValue(makeUser({ isActive: true }));
        // password grant success
        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'jwt-token', expires_in: 86400 })),
        );
  
        const result = await service.login(validDto);
        expect(result.access_token).toBe('jwt-token');
        expect(result.requiresOTP).toBe(false);
      });
  
      it('calls Auth0 token endpoint with password grant', async () => {
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: true }])),
        );
        usersService.findByAuth0Id.mockResolvedValue(makeUser({ isActive: true }));
        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'jwt', expires_in: 86400 })),
        );
  
        await service.login(validDto);
        const loginCall = httpService.post.mock.calls.find(
          (call: any) => call[0].includes('/oauth/token') && call[1]?.grant_type === 'password',
        );
        expect(loginCall).toBeDefined();// unsure about this part, recieved some help here, but it works so.... lets go.
        expect(loginCall[1]).toMatchObject({
          grant_type: 'password',
          audience: 'https://phishshield-api',
          scope: 'openid profile email',
        });
      });
  
      it('throws UnauthorizedException when email is not verified', async () => {
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: false }])),
        );
  
        await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
      });
  
      it('throws InternalServerErrorException if getAuth0UserByEmail fails unexpectedly', async () => {
        httpService.get.mockReturnValueOnce(throwError(() => new Error('Network Error')));
  
        await expect(service.login(validDto)).rejects.toThrow(InternalServerErrorException);
      });
  
      it('throws UnauthorizedException on invalid password', async () => {
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: true }])),
        );
        usersService.findByAuth0Id.mockResolvedValue(makeUser({ isActive: true }));
        // password grant fails
        httpService.post.mockReturnValueOnce(throwError(() => ({ response: { status: 403 } })));
  
        await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
      });
  
      it('throws UnauthorizedException when account is deactivated', async () => {
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: true }])),
        );
        usersService.findByAuth0Id.mockResolvedValue(makeUser({ isActive: false }));
  
        await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
      });
  // yes, this should be added, but check and make sure.
      it('requires OTP when sendOTP is set and no device token', async () => {
        httpService.get.mockReturnValueOnce(
          of(axiosOf([{ user_id: 'auth0|abc123', email: 'test@example.com', email_verified: true }])),
        );
        usersService.findByAuth0Id.mockResolvedValue(makeUser({ isActive: true }));
        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'jwt', expires_in: 86400 })),
        );
        otpService.generateAndSend.mockResolvedValue(undefined);
  
        const result = await service.login({ ...validDto, sendOTP: true });
        expect(result.requiresOTP).toBe(true);
        expect(otpService.generateAndSend).toHaveBeenCalledWith(validDto.email);
      });
    });

      describe('verifyOtp', () => {
        it('marks user as verified and returns device token', async () => {
          otpService.verify.mockResolvedValue({ valid: true, deviceToken: 'dev-789' });
          usersService.findByEmail.mockResolvedValue(makeUser());
          usersService.markVerified.mockResolvedValue(undefined);
    
          const result = await service.verifyOtp({
            email: 'test@example.com',
            code: '123456',
            userAgent: 'UA',
            ip: '1.2.3.4',
          });
    // cool this looks good.
          expect(result.message).toContain('verified');
          expect(result.deviceToken).toBe('dev-789');
          expect(usersService.markVerified).toHaveBeenCalledWith('auth0|abc123');
        });
    
        it('throws BadRequestException for invalid OTP', async () => {
          otpService.verify.mockResolvedValue({ valid: false, deviceToken: '' });
    
          await expect(
            service.verifyOtp({
              email: 'test@example.com',
              code: '000000',
              userAgent: '',
              ip: '',
            }),
          ).rejects.toThrow(BadRequestException);
        });
    
        it('throws NotFoundException when user does not exist', async () => {
          otpService.verify.mockResolvedValue({ valid: true, deviceToken: '' });
          usersService.findByEmail.mockResolvedValue(null);
    
          await expect(
            service.verifyOtp({
              email: 'ghost@example.com',
              code: '123456',
              userAgent: '',
              ip: '',
            }),
          ).rejects.toThrow(NotFoundException);
        });
      });

    describe('resendOtp', () => {
      it('sends a new OTP code', async () => {
        usersService.findByEmail.mockResolvedValue(makeUser());
        otpService.generateAndSend.mockResolvedValue(undefined);
  
        const result = await service.resendOtp({ email: 'test@example.com' });
        expect(result.message).toContain('new OTP code');
      });
  
      it('throws NotFoundException when email is unknown', async () => {
        usersService.findByEmail.mockResolvedValue(null);
        await expect(service.resendOtp({ email: 'ghost@example.com' })).rejects.toThrow(
          NotFoundException,
        );
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