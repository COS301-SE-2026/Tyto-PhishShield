/**
 * Integration tests for Education HTTP endpoints.
 *
 * Boots the controller with a real JWT guard (RS256 verified against a static
 * public key). Repository and AMQP dependencies are stubbed so the full
 * guard → strategy → controller → service pipeline is exercised.
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
import { EducationController } from '../src/education/education.controller';
import { EducationService } from '../src/education/education.service';
import { Question } from '../src/education/entities/question.entity';
import { Assignment } from '../src/education/entities/assignment.entity';

const mockQuestionRepo = {
  find: jest.fn(),
  findByIds: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockAssignmentRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
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
    return {
      auth0Id: payload.sub,
      email: payload.email ?? '',
      role: payload['https://phishshield/roles']?.[0] ?? 'user',
    };
  }
}

describe('Education (integration)', () => {
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
      controllers: [EducationController],
      providers: [
        EducationService,
        TestJwtStrategy,
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepo },
        {
          provide: getRepositoryToken(Assignment),
          useValue: mockAssignmentRepo,
        },
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
      privateKeyPem,
      { algorithm: 'RS256', keyid: 'test-kid' },
    );

  it('rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .get('/education/assignment/mine')
      .expect(401);
  });

  it('returns a pending assignment when authenticated', async () => {
    const mockAssignment = {
      id: 'a1',
      auth0Id: 'auth0|123',
      questionIds: ['q1', 'q2'],
      status: 'PENDING',
      createdAt: new Date(),
    };
    const mockQuestions = [
      {
        id: 'q1',
        questionText: 'What is phishing?',
        options: ['A', 'B', 'C'],
        correctOptionIndex: 1,
        createdAt: new Date(),
      },
      {
        id: 'q2',
        questionText: 'What is smishing?',
        options: ['X', 'Y', 'Z'],
        correctOptionIndex: 0,
        createdAt: new Date(),
      },
    ];

    mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);
    mockQuestionRepo.findByIds.mockResolvedValue(mockQuestions);

    await request(app.getHttpServer())
      .get('/education/assignment/mine')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('a1');
        expect(res.body.questions).toHaveLength(2);
        expect(res.body.questions[0]).not.toHaveProperty('correctOptionIndex');
      });
  });
});
