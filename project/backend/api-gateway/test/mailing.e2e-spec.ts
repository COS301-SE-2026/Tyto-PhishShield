import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { MailingModule } from '../src/mailing/mailing.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('Mailing Gateway (e2e)', () => {
  let app: INestApplication;

  let targetReferenceNumber: string;

  const hasLivePermission = process.env.TEST_EMAIL_SEND === 'true';
  const liveTest = hasLivePermission ? it : it.skip;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
          load: [() => ({ MAILING_SERVICE_PORT: 3003 })],
        }),
        MailingModule,
      ],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Sequential Gateway Flow', () => {
    it('/emails (POST) - should create a new email in the downstream service', async () => {
      const payload = {
        recipient: process.env.OUR_EMAIL,
        sender: `test@${process.env.FIVEGUYS_DOMAIN}`,
        subject: 'E2E Gateway Test',
        content: '<p>This is a test</p>',
      };

      const response = await request(app.getHttpServer())
        .post('/emails')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('reference_number');
      expect(response.body.recipient).toBe(payload.recipient);

      targetReferenceNumber = response.body.reference_number;
    });

    it('/emails (GET) - should retrieve all emails', async () => {
      const response = await request(app.getHttpServer())
        .get('/emails')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const found = response.body.find(
        (email: any) => email.reference_number === targetReferenceNumber,
      );
      expect(found).toBeDefined();
    });

    it('/emails/:referenceNumber (GET) - should fetch the specific email', async () => {
      const response = await request(app.getHttpServer())
        .get(`/emails/${targetReferenceNumber}`)
        .expect(200);

      expect(response.body.reference_number).toBe(targetReferenceNumber);
      expect(response.body.subject).toBe('E2E Gateway Test');
    });

    it('/emails/:referenceNumber (PATCH) - should update the email', async () => {
      const updatePayload = { subject: 'Updated E2E Subject' };

      const response = await request(app.getHttpServer())
        .patch(`/emails/${targetReferenceNumber}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.reference_number).toBe(targetReferenceNumber);
      expect(response.body.subject).toBe(updatePayload.subject);
    });

    liveTest(
      '/emails/:referenceNumber/send-single (POST) - should dispatch with Resend',
      async () => {
        const response = await request(app.getHttpServer())
          .post(`/emails/${targetReferenceNumber}/send-single`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty(
          'message',
          'Email sent successfully',
        );
        expect(response.body).toHaveProperty('data');
      },
    );

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
