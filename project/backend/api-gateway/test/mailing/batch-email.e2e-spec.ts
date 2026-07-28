import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { MailingModule } from '../../src/mailing/mailing.module';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

const TEST_SENDER = 'test@capstone-five-guys.dns.net.za';
const TEST_RECIPIENTS = [
  'delivered@resend.dev',
  'delivered@resend.dev',
  'delivered@resend.dev',
];

describe('Mailing Gateway - Batch Email (e2e)', () => {
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

    // Email seed
    const res = await request(app.getHttpServer()).post('/emails').send({
      sender: TEST_SENDER,
      alias: 'Batch Gateway E2E Tester',
      subject: 'Batch Gateway E2E Test',
      content: '<p>Batch gateway e2e test email</p>',
      difficulty: 'medium',
    });

    targetReferenceNumber = res.body.referenceNumber;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Batch Email Gateway Flow', () => {

    it('/batch-emails/:referenceNumber/send-batch-with-reference (POST) - should send one template to all recipients immediately', async () => {
      const response = await request(app.getHttpServer())
        .post(`/batch-emails/${targetReferenceNumber}/send-batch-with-reference`)
        .send({ recipients: TEST_RECIPIENTS })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain(targetReferenceNumber);
      expect(response.body.message).toContain(`${TEST_RECIPIENTS.length}`);
    });

    it('Error Handling - /batch-emails/:referenceNumber/send-batch-with-reference (POST) - should return 404 for unknown reference', async () => {
      const response = await request(app.getHttpServer())
        .post('/batch-emails/PHISH-INVALID99/send-batch-with-reference')
        .send({ recipients: TEST_RECIPIENTS })
        .expect(404);

      expect(response.body.message).toContain('PHISH-INVALID99');
    });

    it('/batch-emails/send-batch-random-same-email (POST) - should send the same random template to all recipients at a shared future time', async () => {
      const scheduledAt = new Date();
      const scheduledAtIso = scheduledAt.toISOString();

      const response = await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-same-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledAtIso,
          scheduledTo: scheduledAtIso,
          randomisedTimes: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain(`${TEST_RECIPIENTS.length}`);
    });

    it('/batch-emails/send-batch-random-same-email (POST) - should schedule each recipient at an independent random time', async () => {
      const scheduledFrom = new Date();
      scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 10);

      const scheduledTo = new Date();
      scheduledTo.setMinutes(scheduledTo.getMinutes() + 15);

      const response = await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-same-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledFrom.toISOString(),
          scheduledTo: scheduledTo.toISOString(),
          randomisedTimes: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain(`${TEST_RECIPIENTS.length}`);
    });

    it('Error Handling - /batch-emails/send-batch-random-same-email (POST) - should return 400 when scheduledTo is before scheduledFrom', async () => {
      const scheduledFrom = new Date();
      scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 15);

      const scheduledTo = new Date();
      scheduledTo.setMinutes(scheduledTo.getMinutes() + 10);

      await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-same-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledFrom.toISOString(),
          scheduledTo: scheduledTo.toISOString(),
          randomisedTimes: false,
        })
        .expect(400);
    });

    it('/batch-emails/send-batch-random-different-email (POST) - should schedule a different random template per recipient at a shared future time', async () => {
      const scheduledAt = new Date();
      const scheduledAtIso = scheduledAt.toISOString();

      const response = await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-different-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledAtIso,
          scheduledTo: scheduledAtIso,
          randomisedTimes: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain(`${TEST_RECIPIENTS.length}`);
    });

    it('/batch-emails/send-batch-random-different-email (POST) - should schedule each recipient at an independent random time with different templates', async () => {
      const scheduledFrom = new Date();
      scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 10);

      const scheduledTo = new Date();
      scheduledTo.setMinutes(scheduledTo.getMinutes() + 15);

      const response = await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-different-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledFrom.toISOString(),
          scheduledTo: scheduledTo.toISOString(),
          randomisedTimes: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain(`${TEST_RECIPIENTS.length}`);
    });

    it('Error Handling - /batch-emails/send-batch-random-different-email (POST) - should return 400 when scheduledTo is before scheduledFrom', async () => {
      const scheduledFrom = new Date();
      scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 15);

      const scheduledTo = new Date();
      scheduledTo.setMinutes(scheduledTo.getMinutes() + 10);

      await request(app.getHttpServer())
        .post('/batch-emails/send-batch-random-different-email')
        .send({
          recipients: TEST_RECIPIENTS,
          difficulty: 'medium',
          scheduledFrom: scheduledFrom.toISOString(),
          scheduledTo: scheduledTo.toISOString(),
          randomisedTimes: false,
        })
        .expect(400);
    });
  });
});
