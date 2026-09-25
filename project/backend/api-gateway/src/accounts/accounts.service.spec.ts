/**
 * Tests for {@link AccountsService}
 *
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';
import { AccountsService } from './accounts.service';
import { LoginDto } from '../dto/login.dto';
import { OtpService } from '../otp/otp.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

// jest.mock('http', () => ({
//   HttpService: jest.fn().mockImplementation(() => ({
//     get: jest.fn().mockResolvedValue({
//       user_id: 'ID',
//       email: 'EMAIL',
//       name: 'NAME',
//       email_verified: true
//     }),
//     post: jest.fn().mockRejectedValue({
//       access_token: 'token',
//       expires_in: 100,
//       token_type: 'any'
//     })
//   })),
// }));

interface ForwardOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  requestId?: string;
}

const mockEnv = (key: string) => {
  if (key === 'ACCOUNTS_SERVICE_URL') return 'http://accounts';
  if (key === 'AUTH0_DOMAIN') return 'domain';
  if (key === 'AUTH0_M2M_CLIENT_ID') return 'clientID';
  if (key === 'AUTH0_M2M_CLIENT_SECRET') return 'clientSecret';
  if (key === 'AUTH0_AUDIENCE') return 'audience';
  return 'unknown';
}

const mockOtpService = {
  generateAndSend: jest.fn().mockResolvedValue(true),
};

describe('AccountsService', () => {
  let accountsService: AccountsService;
  let otpService: jest.Mocked<OtpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(mockEnv),
            getOrThrow: jest.fn(mockEnv),
          },
        },
        {
          provide: ProxyService,
          useValue: {
            forward: jest.fn((options: ForwardOptions) => {
              if (options.url === `${mockEnv('ACCOUNTS_SERVICE_URL')}/api/auth/device/verify`) return 'device token';
              if (options.url === `${mockEnv('ACCOUNTS_SERVICE_URL')}/api/auth/is-active`) return true;
            })
          },
        },
        {
          provide: OtpService,
          useValue: mockOtpService
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({
              data: [
                {
                  user_id: 'ID',
                  email: 'EMAIL',
                  name: 'NAME',
                  email_verified: true,
                },
              ],
            }),),
            post: jest.fn().mockReturnValueOnce(
              of({
                data: {
                  access_token: 'management-token',
                  expires_in: 3600,
                  token_type: 'Bearer',
                },
              }),
            )
            .mockReturnValueOnce(
              of({
                data: {
                  access_token: 'token',
                  expires_in: 100,
                  token_type: 'Bearer',
                },
              }),
            ),
          }
        }
      ],
    }).overrideProvider(OtpService)
  .useValue(mockOtpService)
  .compile();

    accountsService = module.get<AccountsService>(AccountsService);
    otpService = module.get<jest.Mocked<OtpService>>(OtpService);
    expect(otpService).toBe(mockOtpService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('Normal valid login', async () => {
      const loginObject: LoginDto = {
        email: 'EMAIL',
        password: 'My Password',
        deviceToken: 'device token',
        sendOTP: true,
      }
      const response = await accountsService.login(loginObject);

      expect(response.access_token).toBe('token');
      expect(response.expires_in).toBe(100);
      expect(response.requiresOTP).toBe(false);
    });

    it('Login with invalid / no device token', async () => {
      const loginObject: LoginDto = {
        email: 'EMAIL',
        password: 'My Password',
        deviceToken: '',
        sendOTP: true,
      }
      const response = await accountsService.login(loginObject);

      expect(response.access_token).toBe('token');
      expect(response.expires_in).toBe(100);
      expect(response.requiresOTP).toBe(true);
      expect(otpService.generateAndSend).toHaveBeenCalled();
    });

//     it('returns true for a valid device token', async () => {
      
//     });

//     it('returns false if token not found', async () => {
      
//     });

//     it('returns false if token expired', async () => {
      
//     });
// // important right here.
//     it('throws UnauthorizedException when user does not exist', async () => {
      
//     });
  });
});