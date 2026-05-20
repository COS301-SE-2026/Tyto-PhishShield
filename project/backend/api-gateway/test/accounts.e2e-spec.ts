import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule, HttpService } from '@nestjs/axios';
import request from 'supertest';
import { of, throwError } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AccountsController } from '../src/accounts/accounts.controller';
import { ProxyService } from '../src/proxy/proxy.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

const axiosOf = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as never,
});

describe('Accounts Gateway Endpoints (Integration)', () => {
  let app: INestApplication;
  let httpService: jest.Mocked<HttpService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({
            AUTH0_DOMAIN: 'test.us.auth0.com',
            AUTH0_AUDIENCE: 'https://phishshield-api',
            ACCOUNTS_SERVICE_URL: 'http://accounts-service:3002',
          })],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        HttpModule,
      ],
      controllers: [AppController, AccountsController],
      providers: [AppService, ProxyService, JwtStrategy],
    })
      .overrideProvider(HttpService)
      .useValue({ request: jest.fn() })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    httpService = module.get(HttpService);
  });

  afterAll(async () => app.close());
  afterEach(() => jest.resetAllMocks());

  // ===========================================================================
  // Use Case 1: Register — proxied through gateway
  // ===========================================================================

  describe('POST /api/accounts/auth/register', () => {
    describe('Success', () => {
      it('should return 201 when accounts service registers the user', async () => {
        httpService.request.mockReturnValue(
          of(axiosOf({ message: 'Registration successful', userId: 'uuid-123' })),
        );

        return request(app.getHttpServer())
          .post('/api/accounts/auth/register')
          .send({ email: 'test@example.com', password: 'Password123!', name: 'Test User' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message', 'Registration successful');
            expect(res.body).toHaveProperty('userId');
          });
      });
    });

    describe('Downstream errors passthrough', () => {
      it('should return 409 when accounts service reports duplicate email', async () => {
        httpService.request.mockReturnValue(
          throwError(() => ({ response: { status: 409, data: 'Conflict' } })),
        );

        return request(app.getHttpServer())
          .post('/api/accounts/auth/register')
          .send({ email: 'taken@example.com', password: 'Password123!' })
          .expect(409);
      });

      it('should return 500 when accounts service is unreachable', async () => {
        httpService.request.mockReturnValue(
          throwError(() => new Error('Network Error')),
        );

        return request(app.getHttpServer())
          .post('/api/accounts/auth/register')
          .send({ email: 'test@example.com', password: 'Password123!' })
          .expect(500);
      });
    });
  });

  // ===========================================================================
  // Use Case 2: Login — proxied through gateway
  // ===========================================================================

  describe('POST /api/accounts/auth/login', () => {
    describe('Success', () => {
      it('should return 200 with access_token when accounts service approves login', async () => {
        httpService.request.mockReturnValue(
          of(axiosOf({ access_token: 'jwt-token', expires_in: 86400 })),
        );

        return request(app.getHttpServer())
          .post('/api/accounts/auth/login')
          .send({ email: 'test@example.com', password: 'Password123!' })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('expires_in');
          });
      });
    });

    describe('Downstream errors passthrough', () => {
      it('should return 401 when accounts service rejects credentials', async () => {
        httpService.request.mockReturnValue(
          throwError(() => ({ response: { status: 401, data: 'Unauthorized' } })),
        );

        return request(app.getHttpServer())
          .post('/api/accounts/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
          .expect(401);
      });
    });
  });

  // ===========================================================================
  // Use Case 3: Get Profile — JWT validated at gateway level
  // ===========================================================================

  describe('GET /api/accounts/auth/me', () => {
    it('should return 401 with no Authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/accounts/auth/me')
        .expect(401);
    });

    it('should return 401 with a malformed token', () => {
      return request(app.getHttpServer())
        .get('/api/accounts/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);
    });

    it('should return 401 without Bearer prefix', () => {
      return request(app.getHttpServer())
        .get('/api/accounts/auth/me')
        .set('Authorization', 'some-token-without-bearer')
        .expect(401);
    });
  });
});