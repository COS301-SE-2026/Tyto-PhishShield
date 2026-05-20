import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { AxiosResponse } from 'axios';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/users/entities/user.entity';

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

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({ post: jest.fn() })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        create: jest.fn().mockReturnValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    httpService = module.get(HttpService);
  });

  afterAll(async () => app.close());
  afterEach(() => jest.clearAllMocks());

  // ===========================================================================
  // Use Case 1: Registration
  // ===========================================================================

  describe('POST /api/auth/register', () => {
    describe('Success', () => {
      it('should return 201 with success message on valid registration', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'Test User' })));

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
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(of(axiosOf({ user_id: 'auth0|abc123', email: 'test@example.com', name: 'test@example.com' })));

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
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => ({ response: { status: 409 } })));

        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: 'taken@example.com', password: 'Password123!' })
          .expect(409);
      });

      it('should return 500 on unexpected Auth0 error', async () => {
        httpService.post
          .mockReturnValueOnce(of(axiosOf({ access_token: 'mgmt-token', expires_in: 86400 })))
          .mockReturnValueOnce(throwError(() => ({ response: { status: 500 } })));

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
        httpService.post.mockReturnValueOnce(
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
        httpService.post.mockReturnValueOnce(
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