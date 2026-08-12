/**
 * Integration tests for Analytics HTTP endpoints.
 *
 * Boots the controller with a real JWT guard (RS256 verified against a static
 * public key). The AnalyticsService is stubbed so we can test routing,
 * guard, and controller behaviour without hitting the database.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';

const mockAnalyticsService = {
  recordEvent: jest.fn(),
  getOverview: jest.fn(),
  getReportStats: jest.fn(),
  getMailingStats: jest.fn(),
  getTimeSeries: jest.fn(),
  getLeaderboard: jest.fn(),
  getUserStats: jest.fn(),
};

const mockAmqpConnection = { publish: jest.fn() };

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const publicKeyPem = publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
const privateKeyPem = privateKey
  .export({ type: 'pkcs8', format: 'pem' })
  .toString();

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      secretOrKey: publicKeyPem,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get<string>('AUTH0_AUDIENCE'),
      issuer: `https://${config.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    // same as real strategy, but with test public key
    return {
      auth0Id: payload.sub,
      email: payload.email ?? '',
      role: payload['https://phishshield/roles']?.[0] ?? 'user',
    };
  }
}

describe('Analytics (integration)', () => {
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
              AUTH0_AUDIENCE: 'https://phishshield-api',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        HttpModule,
      ],
      controllers: [AnalyticsController],
      providers: [
        TestJwtStrategy,
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // console.log('cleared mocks'); // i keep forgetting to remove this
  });

  const createToken = () =>
    jwt.sign(
      {
        sub: 'auth0|123',
        email: 'user@example.com',
        iss: 'https://test.us.auth0.com/',
        aud: 'https://phishshield-api',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      privateKeyPem,
      { algorithm: 'RS256', keyid: 'test-kid' },
    );

  it('rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/analytics/overview').expect(401);
  });

  it('returns overview stats when authenticated', async () => {
    const overview = {
      totalEmailsSent: 10,
      totalReports: 5,
      confirmedPhishing: 2,
      falsePositives: 3,
      totalXpGiven: 50,
      educationAssigned: 3,
      educationCompleted: 1,
    };
    mockAnalyticsService.getOverview.mockResolvedValue(overview);

    await request(app.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(overview);
        expect(mockAnalyticsService.getOverview).toHaveBeenCalled();
      });
  });

  it('returns report stats with optional date filters', async () => {
    const reportStats = {
      submitted: 5,
      confirmed: 2,
      falsePositive: 3,
      detectionRate: 40,
    };
    mockAnalyticsService.getReportStats.mockResolvedValue(reportStats);

    await request(app.getHttpServer())
      .get('/analytics/reports?from=2026-08-01&to=2026-08-10')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(reportStats);
        expect(mockAnalyticsService.getReportStats).toHaveBeenCalledWith(
          '2026-08-01',
          '2026-08-10',
        );
      });
  });

  it('handles missing date params for reports', async () => {
    mockAnalyticsService.getReportStats.mockResolvedValue({
      submitted: 0,
      confirmed: 0,
      falsePositive: 0,
      detectionRate: 0,
    });

    await request(app.getHttpServer())
      .get('/analytics/reports')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect(() => {
        expect(mockAnalyticsService.getReportStats).toHaveBeenCalledWith(
          undefined,
          undefined,
        );
      });
  });

  it('returns mailing stats with optional date filters', async () => {
    const mailingStats = { totalSent: 20, scheduled: 5 };
    mockAnalyticsService.getMailingStats.mockResolvedValue(mailingStats);

    await request(app.getHttpServer())
      .get('/analytics/mailing?from=2026-08-01&to=2026-08-10')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(mailingStats);
        expect(mockAnalyticsService.getMailingStats).toHaveBeenCalledWith(
          '2026-08-01',
          '2026-08-10',
        );
      });
  });

  it('returns time series for the given range', async () => {
    const timeSeries = [
      { date: '2026-08-01', reports: 1, emailsSent: 2, xpGiven: 10 },
      { date: '2026-08-02', reports: 2, emailsSent: 3, xpGiven: 20 },
    ];
    mockAnalyticsService.getTimeSeries.mockResolvedValue(timeSeries);

    await request(app.getHttpServer())
      .get('/analytics/timeseries?from=2026-08-01&to=2026-08-02')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(timeSeries);
        expect(mockAnalyticsService.getTimeSeries).toHaveBeenCalledWith(
          '2026-08-01',
          '2026-08-02',
        );
      });
  });

  it('returns leaderboard with limit parameter', async () => {
    const leaderboard = [
      {
        auth0Id: 'user1',
        email: 'u1@example.com',
        totalXp: 100,
        reportCount: 5,
      },
    ];
    mockAnalyticsService.getLeaderboard.mockResolvedValue(leaderboard);

    await request(app.getHttpServer())
      .get('/analytics/leaderboard?limit=5')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(leaderboard);
        expect(mockAnalyticsService.getLeaderboard).toHaveBeenCalledWith(5);
      });
  });

  it('uses default limit when leaderboard limit is omitted', async () => {
    const leaderboard = [
      {
        auth0Id: 'user1',
        email: 'u1@example.com',
        totalXp: 100,
        reportCount: 5,
      },
    ];
    mockAnalyticsService.getLeaderboard.mockResolvedValue(leaderboard);

    await request(app.getHttpServer())
      .get('/analytics/leaderboard')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect(() => {
        expect(mockAnalyticsService.getLeaderboard).toHaveBeenCalledWith(10);
      });
  });

  it('returns per-user stats for a given auth0Id', async () => {
    const userStats = {
      reports: 2,
      confirmed: 1,
      falsePositive: 1,
      totalXp: 20,
      educationCompleted: 1,
    };
    mockAnalyticsService.getUserStats.mockResolvedValue(userStats);

    await request(app.getHttpServer())
      .get('/analytics/users/auth0%7C123')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(userStats);
        expect(mockAnalyticsService.getUserStats).toHaveBeenCalledWith(
          'auth0|123',
        );
      });
  });
});
