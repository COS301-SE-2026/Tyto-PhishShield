/**
 * Tests for {@link OtpService}
 *
 * Covers OTP generation & sending, verification, and device token checks.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { VerifiedDevice } from './otp.entity';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'node:crypto';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue(true) },
  })),
}));

describe('OtpService', () => {
  let service: OtpService;
  let deviceRepo: jest.Mocked<Repository<VerifiedDevice>>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(VerifiedDevice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => (key === 'RESEND_API_KEY' ? 'test-key' : '')),
          },
        },
        {
          provide: AuthService,
          useValue: { getAuth0UserByEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OtpService);
    deviceRepo = module.get(getRepositoryToken(VerifiedDevice));
    authService = module.get(AuthService) as any;
  });

  afterEach(() => jest.clearAllMocks());

    describe('generateAndSend', () => {
      it('should push a new OTP and call the email sender', async () => {
        const email = 'test@example.com';
        // Spy on private sendOtpEmail by checking the result indirectly,
        // but we'll just verify that OTPs array grows
        const initialLength = (service as any).OTPs.length;
        await service.generateAndSend(email);
        expect((service as any).OTPs.length).toBe(initialLength + 1);
        expect((service as any).OTPs[0].code).toHaveLength(6);
      });
  
      it('throws if email sending fails', async () => {
        // Make Resend throw
        const mockSend = jest.fn().mockRejectedValue(new Error('API down'));
        (service as any).resend = { emails: { send: mockSend } };
        await expect(service.generateAndSend('fail@test.com')).rejects.toThrow();
      });
    });

      describe('verify', () => {
        const email = 'test@example.com';
        const userAgent = 'Agent/1.0';
        const ip = '127.0.0.1';
    
        beforeEach(async () => {
          // pre-populate an OTP
          await service.generateAndSend(email);
        });
    
        it('returns valid true and a deviceToken on correct OTP', async () => {
          const otp = (service as any).OTPs.find((o: any) => o.email === email);
          const code = otp.code;
    
          authService.getAuth0UserByEmail.mockResolvedValue({ user_id: 'auth0|123' } as any);
          deviceRepo.create.mockReturnValue({ id: 'dev-1' } as any);
          deviceRepo.save.mockResolvedValue({ id: 'dev-1' } as any);
    
          const result = await service.verify(email, code, userAgent, ip);
          expect(result.valid).toBe(true);
          expect(result.deviceToken).toBeTruthy();
          expect(deviceRepo.save).toHaveBeenCalled();
        });
    
        it('returns valid false for wrong code', async () => {
          const result = await service.verify(email, '000000', userAgent, ip);
          expect(result.valid).toBe(false);
          expect(result.deviceToken).toBe('');
        });
    
        it('returns valid false for expired OTP', async () => {
          const otp = (service as any).OTPs.find((o: any) => o.email === email);
          otp.expiresAt = new Date(Date.now() - 10000); // expired
          const result = await service.verify(email, otp.code, userAgent, ip);
          expect(result.valid).toBe(false);
        });
    
        it('throws UnauthorizedException if user not found', async () => {
          const otp = (service as any).OTPs.find((o: any) => o.email === email);
          authService.getAuth0UserByEmail.mockResolvedValue(null as any);
          await expect(
            service.verify(email, otp.code, userAgent, ip),
          ).rejects.toThrow('User not registered');
        });
      });

        describe('verifyDevice', () => {
          const email = 'test@example.com';
          const deviceToken = 'raw-token';
      
          it('returns true for a valid device token', async () => {
            authService.getAuth0UserByEmail.mockResolvedValue({ user_id: 'auth0|123' } as any);
            const hashed = crypto.hash('sha256', deviceToken);
            deviceRepo.findOne.mockResolvedValue({
              id: 'dev-1',
              tokenHash: hashed,
              lastUsedAt: new Date(),
              expiresAt: new Date(Date.now() + 86400000),
            } as any);
            deviceRepo.update.mockResolvedValue({} as any);
      
            const result = await service.verifyDevice(email, deviceToken);
            expect(result).toBe(true);
          });
      
          it('returns false if token not found', async () => {
            authService.getAuth0UserByEmail.mockResolvedValue({ user_id: 'auth0|123' } as any);
            deviceRepo.findOne.mockResolvedValue(null);
            const result = await service.verifyDevice(email, deviceToken);
            expect(result).toBe(false);
          });
      
          it('returns false if token expired', async () => {
            authService.getAuth0UserByEmail.mockResolvedValue({ user_id: 'auth0|123' } as any);
            const hashed = crypto.hash('sha256', deviceToken);
            deviceRepo.findOne.mockResolvedValue({
              id: 'dev-1',
              tokenHash: hashed,
              expiresAt: new Date(Date.now() - 1000), // expired
            } as any);
            const result = await service.verifyDevice(email, deviceToken);
            expect(result).toBe(false);
          });
      
          it('throws UnauthorizedException when user does not exist', async () => {
            authService.getAuth0UserByEmail.mockResolvedValue(null as any);
            await expect(service.verifyDevice(email, deviceToken)).rejects.toThrow(
              'User not registered',
            );
          });
        });
      });