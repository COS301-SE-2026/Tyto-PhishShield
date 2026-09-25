/**
 * Integration tests for Report HTTP endpoints.
 *
 * Boots the controller with a real JWT guard that verifies an RS256 signature
 * against a static public key (no external JWKS fetch needed).
 * Repository and AMQP dependencies are stubbed.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ReportController } from '../src/report/report.controller';
import { ReportService } from '../src/report/report.service';
import { Report } from '../src/report/entities/report.entity';
import { Reportable } from '../src/report/entities/reportable.entity';
const mockReportRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockReportableRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockAmqpConnection = { publish: jest.fn() };

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      //lets use this key I think it will be better this way.
      secretOrKey: publicKey,
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
describe('Report (integration)', () => {
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
      controllers: [ReportController],
      providers: [
        ReportService,
        TestJwtStrategy,
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        {
          provide: getRepositoryToken(Reportable),
          useValue: mockReportableRepo,
        }, // hopefully this mock works now man.

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
      privateKey,
      { algorithm: 'RS256', keyid: 'test-kid' },
    );

  it('rejects unauhenticated requests', () => {
    return request(app.getHttpServer()).get('/report').expect(401);
  });

  it('accepts a vald JWT and returns data from the service', async () => {
    // make sure with Jousa.
    const reports = [{ id: 'r1' }];
    mockReportRepo.find.mockResolvedValue(reports as any);

    await request(app.getHttpServer())
      .get('/report')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect(reports);
  });
});
