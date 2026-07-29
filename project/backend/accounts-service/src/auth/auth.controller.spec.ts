/**
 * Tests for {@link AuthController}
 *
 * Covers registration, login (with device token), profile retrieval,
 * OTP verification with cookie, and account deletion.
 *
 * Public endpoints tested:
 * - {@link AuthController#register}
 * - {@link AuthController#login}
 * - {@link AuthController#getProfile}
 * - {@link AuthController#updateProfile}
 * - {@link AuthController#forgotPassword}
 * - {@link AuthController#deleteOwnAccount}
 * - {@link AuthController#getUserByAuth0Id}
 * - {@link AuthController#verifyOtp}
 * - {@link AuthController#resendOtp}
 * - {@link AuthController#logout}
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { Response, Request} from 'express';

const mockResponse = () => {
  const res = {} as Response;
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};


describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { register: jest.fn(), login: jest.fn(), logout: jest.fn(), updateProfile: jest.fn(), deleteUser: jest.fn(), 
            forgotPassword: jest.fn(), verifyOtp: jest.fn(), resendOtp: jest.fn()
           },
        },
        {
          provide: UsersService,
          useValue: { removeByAuth0Id: jest.fn(), findByAuth0Id: jest.fn()},
        },
      
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());
// for register remember we are doing verification through auth0 and otp with login. It switch.
  describe('register()', () => {
    it('delegates to authService.register and returns result', async () => {
      authService.register.mockResolvedValue({ message: 'Registration successful. Please verify your email with the OTP sent to you.', });

      const dto = { email: 'new@user.com', password: 'Password123!', name: 'New'};
      const result = await controller.register(dto);

      expect(result.message).toContain('Registration successful');
      expect(authService.register).toHaveBeenCalledWith(dto);
    });

    it('throws ConflictException when email already exists.', async () => {
      authService.register.mockRejectedValue(new ConflictException());

      await expect(
        controller.register({ email: 'taken@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('passes request cookies as deviceToken', async () => {
      authService.login.mockResolvedValue({ access_token: 'jwt-token', expires_in: 86400 });

      const req = { cookies: {device_token: 'dev123' }} as unknown as Request;
      await controller.login(req, { email: 'a@b.com', password: 'pw'});
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({ deviceToken: 'dev123'}),
      );
    });
// this looks good.
    it('returns the login payload', async() => {
      authService.login.mockResolvedValue({ access_token: 'abc', expires_in: 7200});
      const req =  { cookies: {} } as  unknown as Request;
      const result = await controller.login(req, {email: 'x', password: 'y'});
      expect(result.access_token).toBe('abc');
    });

    it('throws UnauthorizedException when credentials are invalid', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException());
      const req = { cookies: {} } as unknown as Request;
      await expect(
        controller.login(req, {email: 'bad', password: 'creds'}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return the user from req.user', () => {
      const user = {
        auth0Id: 'auth0|1',
        email: 'u@test.com',
        role: UserRole.USER,
        name: 'Test User',
        department: 'Finance',// new, remember to add department for userws.
      };
      const result = controller.getProfile({ user } as any);
      expect(result).toEqual(user);
    });
  });

    describe('updateProfile', () => {
    it('calls authService.updateProfile with auth0Id and dto', async () => {
      authService.updateProfile.mockResolvedValue({ message: 'Profile updated successfully' });
      const req = { user: { auth0Id: 'auth0|42' } } as any;
      const dto = { name: 'New Name' };

      const res = await controller.updateProfile(req, dto);
      expect(authService.updateProfile).toHaveBeenCalledWith('auth0|42', dto);
      expect(res.message).toMatch(/updated/);
    });
  });

    describe('forgotPassword', () => {
    it('calls authService.forgotPassword with the email', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'If an account exists...' });
      const result = await controller.forgotPassword('a@b.com');
      expect(authService.forgotPassword).toHaveBeenCalledWith('a@b.com');
      expect(result.message).toContain('If an account exists');
    });
  });

    describe('deleteOwnAccount', () => {
    it('removes user via Auth0 and DB', async () => {
      authService.deleteUser.mockResolvedValue(undefined);
      usersService.removeByAuth0Id.mockResolvedValue(undefined);
      const req = { user: { auth0Id: 'auth0|99' } } as any;

      await controller.deleteOwnAccount(req);
      expect(authService.deleteUser).toHaveBeenCalledWith('auth0|99');
      expect(usersService.removeByAuth0Id).toHaveBeenCalledWith('auth0|99');
    });
  });

    describe('getUserByAuth0Id', () => {
      it('returns email, role, and name for a known user', async () => {
        usersService.findByAuth0Id.mockResolvedValue({
          email: 'a@b.com',
          role: UserRole.USER,
          name: 'Test',
        } as any);
  
        const result = await controller.getUserByAuth0Id('auth0|xyz');
        expect(result).toEqual({
          email: 'a@b.com',
          role: UserRole.USER,
          name: 'Test',
        });
      });
  // why did this not work initially?
      it('throws NotFoundException for an unknown user', async () => {
        usersService.findByAuth0Id.mockResolvedValue(null);
        await expect(controller.getUserByAuth0Id('ghost')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

      describe('verifyOtp', () => {
        it('calls authService.verifyOtp with extended dto and sets cookie', async () => {
          const mockRes = mockResponse();
          const req = {
            header: (name: string) => (name === 'user-agent' ? 'test-agent' : ''),
            ip: '127.0.0.1',
          } as unknown as Request;
          authService.verifyOtp.mockResolvedValue({
            message: 'Email verified successfully. You can now log in.',
            deviceToken: 'dev-456',
          });
    
          const dto = { email: 'a@b.com', code: '123456' };
          const result = await controller.verifyOtp(req, dto, mockRes);
    
          expect(authService.verifyOtp).toHaveBeenCalledWith({
            email: dto.email,
            code: dto.code,
            userAgent: 'test-agent',
            ip: '127.0.0.1',
          });
          expect(mockRes.cookie).toHaveBeenCalledWith(
            'device_token',
            'dev-456',
            expect.objectContaining({ httpOnly: true, secure: true }),
          );
          expect(result).toEqual({ message: expect.stringContaining('verified') });
        });
      });

        describe('resendOtp', () => {
          it('passes dto to authService.resendOtp', async () => {
            authService.resendOtp.mockResolvedValue({
              message: 'A new OTP code has been sent to your email.',
            });
            const dto = { email: 'a@b.com' };
            const result = await controller.resendOtp(dto);
            expect(authService.resendOtp).toHaveBeenCalledWith(dto);
            expect(result.message).toContain('new OTP code');
          });
        });
//more convenience teest, dont see world where logout fails, but obviously good to add.
          describe('logout', () => {
            it('returns the logout message from service', () => {
              authService.logout.mockReturnValue({
                message: 'Logged out sucessfully. Please discard your access token.',
              });
              const result = controller.logout();
              expect(result.message).toMatch(/discard your access token/);
            });
          });
        });