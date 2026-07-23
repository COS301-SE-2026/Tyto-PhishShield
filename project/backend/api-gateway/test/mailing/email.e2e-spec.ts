import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { MailingModule } from '../../src/mailing/mailing.module';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

const TEST_SENDER = 'test@capstone-five-guys.dns.net.za';
const TEST_RECIPIENT = 'delivered@resend.dev';

describe('Mailing Gateway - Email (e2e)', () => {
  let app: INestApplication;

  let targetReferenceNumber: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), MailingModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Email Gateway Flow', () => {

    it('/emails (POST) - should create a new email in the downstream service', async () => {
      const response = await request(app.getHttpServer())
        .post('/emails')
        .send({
          sender: TEST_SENDER,
          alias: 'E2E Tester',
          subject: 'E2E Gateway Test',
          content: '<p>This is a test</p>',
          difficulty: 'medium',
        })
        .expect(201);

      expect(response.body).toHaveProperty('referenceNumber');

      targetReferenceNumber = response.body.referenceNumber;
    });

    it('/emails (GET) - should retrieve all emails', async () => {
      const response = await request(app.getHttpServer())
        .get('/emails')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const found = response.body.find(
        (email: any) => email.referenceNumber === targetReferenceNumber,
      );
      expect(found).toBeDefined();
    });

    it('/emails/:referenceNumber (GET) - should fetch the specific email', async () => {
      const response = await request(app.getHttpServer())
        .get(`/emails/${targetReferenceNumber}`)
        .expect(200);

      expect(response.body.referenceNumber).toBe(targetReferenceNumber);
      expect(response.body.subject).toBe('E2E Gateway Test');
    });

    it('/emails/:referenceNumber (PATCH) - should update the email', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/emails/${targetReferenceNumber}`)
        .send({ subject: 'Updated E2E Subject' })
        .expect(200);

      expect(response.body.referenceNumber).toBe(targetReferenceNumber);
      expect(response.body.subject).toBe('Updated E2E Subject');
    });

    it('/emails/:referenceNumber/send-single (POST) - should dispatch with Resend', async () => {
      const response = await request(app.getHttpServer())
        .post(`/emails/${targetReferenceNumber}/send-single`)
        .send({ recipient: TEST_RECIPIENT })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('sent instantly.');
      expect(response.body).toHaveProperty('deliveryId');
    });

    it('/emails/:referenceNumber/schedule-send-single (POST) - should schedule with Resend', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 2);

      const response = await request(app.getHttpServer())
        .post(`/emails/${targetReferenceNumber}/schedule-send-single`)
        .send({
          recipient: TEST_RECIPIENT,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('successfully scheduled');
      expect(response.body).toHaveProperty('deliveryId');
    });

    it('Error Handling - should return 404 for a non-existent reference', async () => {
      const badRef = 'PHISH-INVALID99';

      const response = await request(app.getHttpServer())
        .get(`/emails/${badRef}`)
        .expect(404);

      expect(response.body.message).toBe(
        `Email with reference ${badRef} not found`,
      );
    });
  });
});
