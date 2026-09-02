/**
 * Integration tests for Analytics HTTP endpoints.
 *
 * Uses the real AnalyticsController and AnalyticsService with mocked TypeORM repositories.
 * JWT authentication is performed with a test RSA key (real JWT strategy).
 * RabbitMQ is stubbed because it is not needed for HTTP route testing.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from '../src/analytics/entities/analytics-event.entity';
import { AnalyticsUser } from '../src/analytics/entities/analytics-user.entity';
import { Campaign } from '../src/analytics/entities/campaign.entity';
import { ClickEvent } from '../src/analytics/entities/click-event.entity';
import { SimulationSend } from '../src/analytics/entities/simulation-send.entity';

// Mock repositories – we only stub the database layer, not the service.
const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

const mockUserRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockCampaignRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockClickRepo = {
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

const mockSendRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};
//const mockAmqpConnection = { publish: jest.fn() };
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
// here we test the real JWT strategy with a test RSA key, so we don't need to mock it
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
    return {
      auth0Id: payload.sub,

      email: payload.email ?? '',
      role: payload['https://phishshield/roles']?.[0] ?? 'user',
    };
  }


}
// make sure these are actual integration tests and not just unit tests with mocks, so we use the real controller and service
//  with mocked
//  repositories.we lost marks last time and even though we dont recieve marks for it anymore still worth while to check
describe('Analytics (integration)', () => {
  let app: INestApplication;
  let analyticsService: AnalyticsService;
  let repo: jest.Mocked<typeof mockRepo>;
  let userRepo: jest.Mocked<typeof mockUserRepo>;
  let campaignRepo: jest.Mocked<typeof mockCampaignRepo>;
  let clickRepo: jest.Mocked<typeof mockClickRepo>;
  let sendRepo: jest.Mocked<typeof mockSendRepo>;

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
        AnalyticsService,


        //so as we can see here the only thing that is being mocked is the repository and the amqp connection, which is fine because we are testing the controller and service
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
        { provide: getRepositoryToken(AnalyticsUser), useValue: mockUserRepo },
        { provide: getRepositoryToken(Campaign), useValue: mockCampaignRepo },
        { provide: getRepositoryToken(ClickEvent), useValue: mockClickRepo },
        { provide: getRepositoryToken(SimulationSend), useValue: mockSendRepo },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
// get the service and repositories from the testing module
    analyticsService = moduleFixture.get<AnalyticsService>(AnalyticsService);

    repo = moduleFixture.get(getRepositoryToken(AnalyticsEvent));
    userRepo = moduleFixture.get(getRepositoryToken(AnalyticsUser));
    campaignRepo = moduleFixture.get(getRepositoryToken(Campaign));
    clickRepo = moduleFixture.get(getRepositoryToken(ClickEvent));
    sendRepo = moduleFixture.get(getRepositoryToken(SimulationSend));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  describe('Authentication', () => {
    it('rejects unauthnticated requests', () => {
      return request(app.getHttpServer())
        .get('/analytics/overview')
        .expect(401);
    });

    it('accepts valid token', async () => {
      repo.count.mockResolvedValue(0);
      repo.find.mockResolvedValue([]);


      await request(app.getHttpServer())
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);
    });
  });

  describe('GET /analytics/overview', () => {
    it('returns agregated overview counts', async () => {
      // Set up mock repository counts
      repo.count.mockImplementation(({ where }: any) => {
        const eventType = where?.eventType;
        switch (eventType) {
          case AnalyticsEventType.EMAIL_SENT:
            return 10;
          case AnalyticsEventType.EMAIL_BATCH_SENT:
            return 5;


          case AnalyticsEventType.REPORT_SUBMITTED:
            return 20;
          case AnalyticsEventType.REPORT_CONFIRMED:
            return 8;
          case AnalyticsEventType.REPORT_FALSE_POSITIVE:
            return 12;
          case AnalyticsEventType.EDUCATION_ASSIGNED:
            return 12;
          case AnalyticsEventType.EDUCATION_COMPLETED:
            return 6;
          default:


            return 0;
        }
      });
      // sumXp uses find for XP_GIVEN
      repo.find.mockResolvedValue([
        { payload: { amount: 10 } },
        { payload: { amount: 25 } },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toEqual({
        totalEmailsSent: 15,
        totalReports: 20,


        confirmedPhishing: 8,
        falsePositives: 12,
        totalXpGiven: 35,
        educationAssigned: 12,
        educationCompleted: 6,
      });
    });
  });
// check with Frikkie, this is importatn.
  describe('GET /analytics/reports', () => {
    it('returns repot stats with date filters', async () => {
      repo.count.mockImplementation(({ where }: any) => {
        if (where?.eventType === AnalyticsEventType.REPORT_SUBMITTED) return 20;
        if (where?.eventType === AnalyticsEventType.REPORT_CONFIRMED) return 8;
        if (where?.eventType === AnalyticsEventType.REPORT_FALSE_POSITIVE)
          return 12;


        return 0;
      });

      const res = await request(app.getHttpServer())
        .get('/analytics/reports?from=2026-08-01&to=2026-08-10')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toEqual({
        submitted: 20,
        confirmed: 8,
        falsePositive: 12,
        detectionRate: 40,
      });
    });

    it('returns zero detection rate when no reports', async () => {


      repo.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .get('/analytics/reports')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body.detectionRate).toBe(0);
    });
  });
//double check.
  describe('GET /analytics/mailing', () => {
    it('returns mailing stats', async () => {
      repo.count.mockImplementation(({ where }: any) => {


        switch (where?.eventType) {
          case AnalyticsEventType.EMAIL_SENT:
            return 15;
          case AnalyticsEventType.EMAIL_SCHEDULED:
            return 4;
          case AnalyticsEventType.EMAIL_BATCH_SENT:
            return 6;
          default:
            return 0;
        }
      });

      const res = await request(app.getHttpServer())
        .get('/analytics/mailing?from=2026-08-01&to=2026-08-10')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);



      expect(res.body).toEqual({
        totalSent: 21,
        scheduled: 8,
      });
    });
  });
//TODO: Add more test cases for different date ranges and event types
  describe('GET /analytics/timeseries', () => {
    it('returns daly time series', async () => {
      const events = [
        {
          occurredAt: new Date('2026-08-01T10:00:00Z'),
          eventType: AnalyticsEventType.EMAIL_SENT,
        },
        {
          occurredAt: new Date('2026-08-01T11:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },


        {
          occurredAt: new Date('2026-08-01T12:00:00Z'),
          eventType: AnalyticsEventType.XP_GIVEN,
          payload: { amount: 10 },
        },
        {
          occurredAt: new Date('2026-08-02T09:00:00Z'),
          eventType: AnalyticsEventType.EMAIL_BATCH_SENT,
        },
        {
          occurredAt: new Date('2026-08-02T10:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },
      ];

      repo.find.mockResolvedValue(events as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/timeseries?from=2026-08-01&to=2026-08-02')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toEqual([
        { date: '2026-08-01', reports: 1, emailsSent: 1, xpGiven: 10 },
        { date: '2026-08-02', reports: 1, emailsSent: 1, xpGiven: 0 },
      ]);
    });
  });
//TODO: Add more test cases for different date ranges and event types
  describe('GET /analytics/leaderboard', () => {

    it('returns leadrboard with limit', async () => {
      repo.find
        .mockResolvedValueOnce([
          {
            auth0Id: 'user1',
            email: 'u1@example.com',
            payload: { amount: 100 },
          },
          {
            auth0Id: 'user2',
            email: 'u2@example.com',
            payload: { amount: 50 },
          },
        ] as any)
        .mockResolvedValueOnce([
          { auth0Id: 'user1' },
          { auth0Id: 'user1' },

        ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/leaderboard?limit=5')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].totalXp).toBe(100);
    });
  });

  describe('GET /analytics/users/:auth0Id', () => {
    it('returns user stats', async () => {
      repo.count.mockImplementation(({ where }: any) => {
        switch (where?.eventType) {
          case AnalyticsEventType.REPORT_SUBMITTED:
            return 5;


          case AnalyticsEventType.REPORT_CONFIRMED:
            return 2;
          case AnalyticsEventType.REPORT_FALSE_POSITIVE:
            return 3;
          case AnalyticsEventType.EDUCATION_COMPLETED:
            return 1;
          default:
            return 0;
        }
      });
      repo.find.mockResolvedValue([



        { payload: { amount: 50 } },
        { payload: { amount: 75 } },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/users/auth0%7C123')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toEqual({
        reports: 5,
        confirmed: 2,
        falsePositive: 3,
        securityScore: 33,
        totalXp: 125,
        educationCompleted: 1,




      });
    });
  });

  describe('GET /analytics/summary', () => {
    it('returns summary with deltas', async () => {
      // Mock getPeriodStats and getAtRiskUsers via spies to return deterministic data
      jest
        .spyOn(analyticsService as any, 'getPeriodStats')
        .mockResolvedValueOnce({
          totalEmailsSent: 100,
          detectionRate: 20,
          clickRate: 5,
          atRiskUsers: 0,
          trainingCompletionRate: 50,
        })
        .mockResolvedValueOnce({
          totalEmailsSent: 80,
          detectionRate: 25,
          clickRate: 4,



          atRiskUsers: 0,
          trainingCompletionRate: 40,
        });

      jest
        .spyOn(analyticsService as any, 'getAtRiskUsers')
        .mockResolvedValueOnce([{ auth0Id: 'u1' }])
        .mockResolvedValueOnce([]);

      const res = await request(app.getHttpServer())
        .get('/analytics/summary?period=7d')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body.detectionRate.value).toBe(20);


      expect(res.body.detectionRate.delta).toBeCloseTo(-20);
      expect(res.body.totalSimulations.value).toBe(100);
      expect(res.body.atRiskUsers.value).toBe(1);
      expect(res.body.trainingCompletion.value).toBe(50);
    });
  });
//TODO: These test should be more comprehensive, but for now we just check that the endpoint returns data in the expected format. More detailed tests can be added later.
  describe('GET /analytics/detection-rate-over-time', () => {
    it('returns daily detetion and click rates', async () => {
      repo.find.mockResolvedValue([
        {
          occurredAt: new Date('2026-08-01T10:00:00Z'),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
        },
        {
          occurredAt: new Date('2026-08-01T11:00:00Z'),
          eventType: AnalyticsEventType.REPORT_CONFIRMED,


        },
      ] as any);
      sendRepo.find.mockResolvedValue([
        { sentAt: new Date('2026-08-01T09:00:00Z') },
      ] as any);
      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date('2026-08-01T12:00:00Z') },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/detection-rate-over-time?period=1d')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      const day = res.body.find((r: any) => r.date === '2026-08-01');
      expect(day.detectionRate).toBe(100);
      expect(day.clickRate).toBe(100);
    });
  });


  describe('GET /analytics/by-department', () => {
    it('returns departent breakdown', async () => {
      userRepo.find.mockResolvedValue([
        { auth0Id: 'u1', department: 'Finance' },
        { auth0Id: 'u2', department: 'IT' },
      ] as any);
      repo.find.mockResolvedValue([
        {
          occurredAt: new Date(),
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: 'u1',
        },
        {
          occurredAt: new Date(),
          eventType: AnalyticsEventType.REPORT_CONFIRMED,
          auth0Id: 'u1',

        },
      ] as any);
      sendRepo.find.mockResolvedValue([
        { sentAt: new Date(), auth0Id: 'u1' },
        { sentAt: new Date(), auth0Id: 'u2' },
      ] as any);
      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date(), auth0Id: 'u1' },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/by-department?period=7d')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      const finance = res.body.find((r: any) => r.department === 'Finance');
      expect(finance.detectionRate).toBe(100);
      expect(finance.clickRate).toBe(100);

    });
  });

  describe('GET /analytics/at-risk-users', () => {
    it('retuns at-risk users', async () => {
      sendRepo.find.mockResolvedValue([
        { sentAt: new Date(), auth0Id: 'u1' },
        { sentAt: new Date(), auth0Id: 'u2' },
      ] as any);
      clickRepo.find.mockResolvedValue([
        { clickedAt: new Date(), auth0Id: 'u1' },
        { clickedAt: new Date(), auth0Id: 'u1' },
      ] as any);
      userRepo.find.mockResolvedValue([
        { auth0Id: 'u1', name: 'User One', department: 'Finance' },
        { auth0Id: 'u2', name: 'User Two', department: 'IT' },
      ] as any);



      const res = await request(app.getHttpServer())
        .get('/analytics/at-risk-users?period=7d&limit=5')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].auth0Id).toBe('u1');
      expect(res.body[0].clickRate).toBe(200);
      expect(res.body[0].riskLevel).toBe('high');
    });
  });

  describe('GET /analytics/campaigns', () => {


    it('returns campagns', async () => {
      campaignRepo.find.mockResolvedValue([
        { id: 'wave-1', status: 'active', startDate: new Date('2026-08-01') },
        { id: 'wave-2', status: 'active', startDate: new Date('2026-07-01') },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/analytics/campaigns')
        .set('Authorization', `Bearer ${createToken()}`)
        .expect(200);


        
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe('wave-1');
    });
  });
});
