import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MailingServiceModule } from '../src/mailing-service.module';
import { EmailDifficulty } from '../src/entities/generated-emails.entity';

// jest.mock('resend', () => {
//   return {
//     Resend: jest.fn().mockImplementation(() => ({
//       emails: {
//         send: jest.fn().mockResolvedValue({ id: 'mock-resend-id' }),
//       },
//     })),
//   };
// });

describe('Email service integration test', () => {
  let app: INestApplication;
  let testReferenceNumber: string;

  const hasLivePermission = process.env.TEST_EMAIL_SEND === 'true';
  const liveTest = hasLivePermission ? it : it.skip;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailingServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/emails (POST) - should create a new email', () => {
    return request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: `test@${process.env.FIVEGUYS_DOMAIN}`,
        alias: 'tester',
        subject: 'E2E Test',
        content: '<p>This is a test</p>',
        difficulty: EmailDifficulty.MEDIUM,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.reference_number).toBeDefined();
        testReferenceNumber = res.body.reference_number;
      });
  });

  it('/emails (GET) - should retrieve all emails', () => {
    return request(app.getHttpServer())
      .get('/emails')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/emails/:referenceNumber (GET) - should fetch specific email', () => {
    return request(app.getHttpServer())
      .get(`/emails/${testReferenceNumber}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.reference_number).toEqual(testReferenceNumber);
      });
  });

  it('/emails/:referenceNumber (PATCH) - should update the email', () => {
    return request(app.getHttpServer())
      .patch(`/emails/${testReferenceNumber}`)
      .send({ subject: 'Updated Subject Line' })
      .expect(200)
      .expect((res) => {
        expect(res.body.subject).toEqual('Updated Subject Line');
      });
  });

  liveTest(
    '/emails/:referenceNumber/send-single (POST) - should trigger live send',
    () => {
      return request(app.getHttpServer())
        .post(`/emails/${testReferenceNumber}/send-single`)
        .send({
          recipient: process.env.OUR_EMAIL,
          emailReferenceNumber: testReferenceNumber
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('sent instantly.');
          expect(res.body.deliveryId).toBeDefined();
        });
    },
  );

  liveTest(
    '/emails/:referenceNumber/schedule-send-single (POST) - should schedule live send',
    () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      return request(app.getHttpServer())
        .post(`/emails/${testReferenceNumber}/schedule-send-single`)
        .send({
          recipient: process.env.OUR_EMAIL,
          emailReferenceNumber: testReferenceNumber,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('successfully scheduled');
          expect(res.body.deliveryId).toBeDefined();
        });
    },
  );
});
