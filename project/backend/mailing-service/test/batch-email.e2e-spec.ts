import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MailingServiceModule } from '../src/mailing-service.module';
import { EmailDifficulty } from '../src/entities/emails.entity';

const TEST_SENDER = 'onboarding@resend.dev';
const TEST_RECIPIENTS = [
  'delivered@resend.dev',
  'delivered@resend.dev',
  'delivered@resend.dev',
];

describe('BatchEmail service integration tests', () => {
  let app: INestApplication;
  let testReferenceNumber: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailingServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Email template seed
    const res = await request(app.getHttpServer()).post('/emails').send({
      sender: TEST_SENDER,
      alias: 'Batch E2E Tester',
      subject: 'Batch E2E Test',
      content: '<p>Batch e2e test email</p>',
      difficulty: EmailDifficulty.MEDIUM,
    });

    testReferenceNumber = res.body.referenceNumber;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it(`/batch-emails/:referenceNumber/send-batch-with-reference (POST) - should send one template to all recipients immediately`, () => {
    return request(app.getHttpServer())
      .post(`/batch-emails/${testReferenceNumber}/send-batch-with-reference`)
      .send({ recipients: TEST_RECIPIENTS })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain(testReferenceNumber);
        expect(res.body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/:referenceNumber/send-batch-with-reference (POST) - should return 404 for unknown reference`, () => {
    return request(app.getHttpServer())
      .post(`/batch-emails/NON-EXISTENT-REF/send-batch-with-reference`)
      .send({ recipients: TEST_RECIPIENTS })
      .expect(404);
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should schedule the same random template to all recipients at a shared future time`, () => {
    const scheduledAt = new Date();
    const scheduledAtIso = scheduledAt.toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should schedule each recipient at an independent random time`, () => {
    const scheduledFrom = new Date();
    scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 10);

    const scheduledTo = new Date();
    scheduledTo.setMinutes(scheduledTo.getMinutes() + 15);

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: true,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should return 400 when scheduledTo is before scheduledFrom`, () => {
    const scheduledFrom = new Date();
    scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 15);

    const scheduledTo = new Date();
    scheduledTo.setMinutes(scheduledTo.getMinutes() + 10);

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: false,
      })
      .expect(400);
  });

  it(`/batch-emails/send-batch-random-different-email (POST) - should schedule a different random template per recipient at a shared future time`, () => {
    const scheduledAt = new Date();
    const scheduledAtIso = scheduledAt.toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-different-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/send-batch-random-different-email (POST) - should schedule each recipient at an independent random time with different templates`, () => {
    const scheduledFrom = new Date();
    scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 10);

    const scheduledTo = new Date();
    scheduledTo.setMinutes(scheduledTo.getMinutes() + 15);

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-different-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: true,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/send-batch-random-different-email (POST) - should return 400 when scheduledTo is before scheduledFrom`, () => {
    const scheduledFrom = new Date();
    scheduledFrom.setMinutes(scheduledFrom.getMinutes() + 15);

    const scheduledTo = new Date();
    scheduledTo.setMinutes(scheduledTo.getMinutes() + 10);

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-different-email`)
      .send({
        recipients: TEST_RECIPIENTS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: false,
      })
      .expect(400);
  });
});