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
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/entities/user.entity';
import type { User } from '../src/users/entities/user.entity';

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
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;
  let httpService: jest.Mocked<HttpService>;

  const mockUsersService = {
    create: jest.fn(),
    findByAuth0Id: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
  };

  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({
            AUTH0_DOMAIN: 'test.us.auth0.com',
            AUTH0_CLIENT_ID: 'client-id',
            AUTH0_CLIENT_SECRET: 'client-secret',
            AUTH0_AUDIENCE: 'https://phishshield-api',
            AUTH0_M2M_CLIENT_ID: 'm2m-client-id',
            AUTH0_M2M_CLIENT_SECRET: 'm2m-client-secret',
          })],
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
      ],
    })
      .overrideProvider(HttpService)
      .useValue({ post: jest.fn() })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    httpService = module.get(HttpService);
  });

  afterAll(async () => app.close());

  // resetAllMocks clears both call history AND the mock implementation/queue
  // This prevents unconsumed mocks from leaking between tests
  afterEach(() => jest.resetAllMocks());

  // ===========================================================================
  // Use Case 1: Registration
  // ===========================================================================

  describe('POST /api/auth/register', () => {
    describe('Success', () => {
      it('should return 201 with success message on valid registration', async () => {
        // URL-based mocking — works regardless of whether the management
        // token is cached or not in the service
        httpService.post.mockImplementation((url: string) => {
          if (url.includes('/api/v2/users')) {
            return of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'Test User' }));
          }
          return of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 }));
        });
        mockUsersService.create.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'test@example.com', password: 'Password123!', name: 'Test User' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message', 'Registration successful');
            expect(res.body).toHaveProperty('userId');
          });
      });

      it('should return 201 when name is omitted', async () => {
        httpService.post.mockImplementation((url: string) => {
          if (url.includes('/api/v2/users')) {
            return of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'test@example.com' }));
          }
          return of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 }));
        });
        mockUsersService.create.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'test@example.com', password: 'Password123!' })
          .expect(201);
      });
    });

    describe('Validation — 400', () => {
      it('should return 400 when email is missing', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ password: 'Password123!' })
          .expect(400);
      });

      it('should return 400 when email format is invalid', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'not-an-email', password: 'Password123!' })
          .expect(400);
      });

      it('should return 400 when password is shorter than 8 characters', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'test@example.com', password: 'short' })
          .expect(400);
      });

      it('should return 400 when body is empty', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({})
          .expect(400);
      });
    });

    describe('Auth0 errors', () => {
      it('should return 409 when email is already registered', async () => {
        httpService.post.mockImplementation((url: string) => {
          if (url.includes('/api/v2/users')) {
            return throwError(() => ({ response: { status: 409 } }));
          }
          return of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 }));
        });

        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'taken@example.com', password: 'Password123!' })
          .expect(409);
      });

      it('should return 500 on unexpected Auth0 error', async () => {
        httpService.post.mockImplementation((url: string) => {
          if (url.includes('/api/v2/users')) {
            return throwError(() => ({ response: { status: 500 } }));
          }
          return of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 }));
        });

        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'test@example.com', password: 'Password123!' })
          .expect(500);
      });
    });
  });

  // ===========================================================================
  // Use Case 2: Login
  // ===========================================================================

  describe('POST /api/auth/login', () => {
    describe('Success', () => {
      it('should return 200 with access_token and expires_in', async () => {
        // Login only makes one call — no management token needed
        httpService.post.mockReturnValue(
          of(axiosOf({ access_token: 'jwt-token', expires_in: 86400 })),
        );

        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'Password123!' })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('expires_in');
            expect(typeof res.body.access_token).toBe('string');
          });
      });
    });

    describe('Validation — 400', () => {
      it('should return 400 when email is missing', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ password: 'Password123!' })
          .expect(400);
      });

      it('should return 400 when password is missing', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com' })
          .expect(400);
      });

      it('should return 400 when email format is invalid', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'not-an-email', password: 'Password123!' })
          .expect(400);
      });
    });

    describe('Auth0 errors', () => {
      it('should return 401 on invalid credentials', async () => {
        httpService.post.mockReturnValue(
          throwError(() => ({ response: { status: 403 } })),
        );

        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
          .expect(401);
      });
    });
  });

  // ===========================================================================
  // Use Case 3: Get Profile
  // ===========================================================================

  describe('GET /api/auth/me', () => {
    it('should return 401 with no token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with a malformed token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.real.jwt')
        .expect(401);
    });

    it('should return 401 without Bearer prefix', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'some-token')
        .expect(401);
    });
  });
});