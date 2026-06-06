import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import type { User } from '../users/entities/user.entity';
import type { AxiosResponse } from 'axios';
import { OtpService } from '../otp/otp.service';

const axiosOf = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as never,
});

const mockUser: User = {
  id: 'uuid-123',
  auth0Id: 'auth0|abc123',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let httpService: jest.Mocked<HttpService>;
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
          },
        },
        { provide: HttpService, useValue: { post: jest.fn() } },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByAuth0Id: jest.fn(),
            findByEmail: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: { generateAndSend: jest.fn(), verify: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get(HttpService);
    usersService = module.get(UsersService);
    otpService = module.get(OtpService);
  });

  afterEach(() => jest.clearAllMocks());


  describe('register()', () => {
    describe('Success', () => {
      it('should register a user and return a success message', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'Test User' })));
        usersService.create.mockResolvedValue(mockUser);
        otpService.generateAndSend.mockResolvedValue(undefined);

        const result = await service.register({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

        expect(result).toEqual({
          message: 'Registration successful. Please check your email for a verification code.',
        });
      });

      it('should save user to DB with USER role by default', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'Test User' })));
        usersService.create.mockResolvedValue(mockUser);
        otpService.generateAndSend.mockResolvedValue(undefined);

        await service.register({ email: 'test@example.com', password: 'Password123!' });

        expect(usersService.create).toHaveBeenCalledWith(
          expect.objectContaining({ role: UserRole.USER, auth0Id: 'auth0|abc123' }),
        );
      });

      it('should reuse cached management token on second registration', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|abc123', email: 'a@example.com', name: 'A' })));
        usersService.create.mockResolvedValue(mockUser);
        otpService.generateAndSend.mockResolvedValue(undefined);
        await service.register({ email: 'a@example.com', password: 'Password123!' });

        jest.clearAllMocks();


        otpService.generateAndSend.mockResolvedValue(undefined);

        httpService.post
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|def456', email: 'b@example.com', name: 'B' })));
        usersService.create.mockResolvedValue({ ...mockUser, email: 'b@example.com' });
        await service.register({ email: 'b@example.com', password: 'Password123!' });


        expect(httpService.post).toHaveBeenCalledTimes(1);
      });

      it('should not write to DB when Auth0 returns an error', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => ({ response: { status: 409 } })));

        await expect(
          service.register({ email: 'taken@example.com', password: 'Password123!' }),
        ).rejects.toThrow();

        expect(usersService.create).not.toHaveBeenCalled();
      });
    });

    describe('Failure', () => {
      it('should throw ConflictException when email already exists in Auth0', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => ({ response: { status: 409 } })));

        await expect(
          service.register({ email: 'taken@example.com', password: 'Password123!' }),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw InternalServerErrorException on unexpected Auth0 error', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => ({ response: { status: 500 } })));

        await expect(
          service.register({ email: 'test@example.com', password: 'Password123!' }),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('should throw InternalServerErrorException when Auth0 is unreachable', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => new Error('Network Error')));

        await expect(
          service.register({ email: 'test@example.com', password: 'Password123!' }),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('login()', () => {
    describe('Success', () => {
      it('should return access_token and expires_in on valid credentials', async () => {
        // The user must be found and verified
        usersService.findByEmail.mockResolvedValue({ ...mockUser, isVerified: true });

        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'jwt-token', expires_in: 86400 })),
        );

        const result = await service.login({
          email: 'test@example.com',
          password: 'Password123!',
        });

        expect(result).toEqual({ access_token: 'jwt-token', expires_in: 86400 });
      });

      it('should call Auth0 with correct grant type and audience', async () => {
        usersService.findByEmail.mockResolvedValue({ ...mockUser, isVerified: true });

        httpService.post.mockReturnValueOnce(
          of(axiosOf({ access_token: 'jwt-token', expires_in: 86400 })),
        );

        await service.login({ email: 'test@example.com', password: 'Password123!' });

        expect(httpService.post).toHaveBeenCalledWith(
          expect.stringContaining('/oauth/token'),
          expect.objectContaining({
            grant_type: 'password',
            audience: 'https://phishshield-api',
            scope: 'openid profile email',
          }),
        );
      });
    });

    describe('Failure', () => {
      it('should throw UnauthorizedException when email is not verified', async () => {
        usersService.findByEmail.mockResolvedValue({ ...mockUser, isVerified: false });

        await expect(
          service.login({ email: 'test@example.com', password: 'Password123!' }),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException on invalid credentials', async () => {

        usersService.findByEmail.mockResolvedValue({ ...mockUser, isVerified: true });
        httpService.post.mockReturnValueOnce(
          throwError(() => ({ response: { status: 403 } })),
        );

        await expect(
          service.login({ email: 'test@example.com', password: 'wrong' }),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when Auth0 is unreachable', async () => {
        usersService.findByEmail.mockResolvedValue({ ...mockUser, isVerified: true });
        httpService.post.mockReturnValueOnce(
          throwError(() => new Error('Network Error')),
        );

        await expect(
          service.login({ email: 'test@example.com', password: 'Password123!' }),
        ).rejects.toThrow(UnauthorizedException);
      });
    });
  });
});