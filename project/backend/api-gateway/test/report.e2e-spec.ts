import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { ReportModule } from '../src/report/report.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CreateReportDto } from '../src/report/dto/create-report.dto';
import { ConfigModule } from '@nestjs/config';

describe('ReportController (e2e)', () => {
  let app: INestApplication;
  const mockUserId = 'auth0|test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ReportModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { auth0Id: mockUserId };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Report Flow', () => {
    it('/report (POST) - should accept phishing report and award XP', async () => {
      const payload: CreateReportDto = {
        subject: 'Test subject',
        from: `admin@${process.env.FIVEGUYS_DOMAIN}`,
        senderName: 'Test name',
        itemId: 'msg-123',
        internetMessageId: '<123@mail.local>',
        dateTimeCreated: new Date().toISOString(),
        dateReported: new Date().toISOString(),
        body: 'Test body',
        source: 'outlook-addin',
      };

      const response = await request(app.getHttpServer())
        .post('/report')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification).toBe('phishing email detected');
      expect(response.body.reportId).toBeDefined();
    });

    it('/report (POST) - should accept a safe email report but NOT award XP', async () => {
      const payload: CreateReportDto = {
        subject: 'Test subject',
        from: 'colleague@example.com',
        senderName: 'Test name',
        itemId: 'msg-456',
        internetMessageId: '<456@mail.local>',
        dateTimeCreated: new Date().toISOString(),
        dateReported: new Date().toISOString(),
        body: 'Test body',
        source: 'outlook-addin',
      };

      const response = await request(app.getHttpServer())
        .post('/report')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification).toBe('not a phishing email');
    });

    it('/report (GET) - should return all saved reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/report')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].subject).toBe('Test subject');
    });

    it('/report/xp (GET) - should return the XP of the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/report/xp')
        .expect(200);

      expect(response.body.userId).toBe(mockUserId);
      expect(response.body.xp).toBe(10);
    });

    it('/report (POST) - should fail validation if "source" is not "outlook-addin"', async () => {
      const invalidPayload = {
        subject: 'Test source',
        from: 'test@test.com',
        senderName: 'Test name',
        itemId: 'msg-789',
        internetMessageId: '<789@mail.local>',
        dateTimeCreated: new Date().toISOString(),
        dateReported: new Date().toISOString(),
        body: 'Test body',
        source: 'Invalid-source',
      };

      const response = await request(app.getHttpServer())
        .post('/report')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.message).toContain(
        'source must be one of the following values: outlook-addin',
      );
    });
  });
});
