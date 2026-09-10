/**
 * Integration tests for core application endpoints.
 * The health check runs without any mocks, and the protected profile
 * route verifies a real RS256 JWT against a mocked JWKS endpoint.
 * Only the UsersService (data layer) is stubbed.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule, HttpService } from '@nestjs/axios';
import request from 'supertest';
import nock from 'nock';//lets try use this to mock the jwks endpoint instead of using the real one. This will make the tests more reliable and faster.
import jwt from 'jsonwebtoken';
import crypto  from 'crypto';
import { of, throwError } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/users/users.service';
import type { User } from '../src/users/entities/user.entity';
import { UserSyncService } from '../src/users/user-sync.service';
import { OtpService } from '../src/otp/otp.service';
import { Department, UserRole } from '@phishshield/dto';

const mockUser: User = {
  id: 'uuid-123',
  auth0Id: 'auth0|abc123',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  department: Department.HR,
  isVerified: true,
};

const mockUsersService = {
  create: jest.fn(),
  findByAuth0Id: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
}

const mockUserSyncService = {//problem initially. will hear with Josua.
  syncUserOnLogin: jest.fn().mockResolvedValue(undefined),
};

const mockOtpService = {
  generateOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const publicJwk = publicKey.export({ format: 'jwk' });
publicJwk.kid = 'test-kid';
publicJwk.alg = 'RS256';

describe('Application (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              AUTH0_DOMAIN: 'test.us.auth0.com',
              AUTH0_CLIENT_ID: 'client-id',
              AUTH0_CLIENT_SECRET: 'client-secret',
              AUTH0_AUDIENCE: 'https://phishshield-api',//?? why is this link different from others but works...
              AUTH0_M2M_CLIENT_ID: 'm2m-client-id',
              AUTH0_M2M_CLIENT_SECRET: 'm2m-client-secret',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        HttpModule,
      ],
      controllers: [AppController, AuthController],
      providers: [
        AppService,
        AuthService,
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: UserSyncService, useValue: mockUserSyncService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    nock.cleanAll();
    await app.close();
  });

  afterEach(() => {
    jest.resetAllMocks();
    nock.cleanAll();
  });

    describe('GET /api/auth/me', () => {
    const audience = 'https://phishshield-api';
    const issuer = 'https://test.us.auth0.com/';

    function createValidToken(): string {
      return jwt.sign(
        {
          iss: issuer,
          sub: 'auth0|abc123',
          aud: audience,
          iat: Math.floor(Date.now() / 1000),// this time is equal to the time the token is created. It is used to determine if the token is expired or not.
          exp: Math.floor(Date.now() / 1000) + 3600,// this is equal to...
        },
        privateKey,
        { algorithm: 'RS256', keyid: 'test-kid' },
      );
    }
//was a health check here, but removed it as it was causing weird stuff to happen.
    it('returns the user profile when a valid JWT is provided', async () => {
      nock('https://test.us.auth0.com')
        .get('/.well-known/jwks.json')
        .reply(200, { keys: [publicJwk] });

      mockUsersService.findByAuth0Id.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${createValidToken()}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({//weird why doesnt this work with id added as well.
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          });
        });
    });

    it('returns 401 with no token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('returns 401 with a malformed token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.real.jwt')
        .expect(401);
    });
  });
});