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

describe('EmailController (e2e)', () => {
  let app: INestApplication;
  let testReferenceNumber: string;

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
        sender: 'test@capstone-five-guys.dns.net.za',
        alias: 'tester',
        recipient: 'dariuserasmus.b@gmail.com',
        subject: 'E2E Test',
        content: '<p>Click here.</p>',
        difficulty: EmailDifficulty.MEDIUM,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.reference_number).toBeDefined();
        expect(res.body.recipient).toEqual('dariuserasmus.b@gmail.com');
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

  it('/emails/:referenceNumber/send-single (POST) - should trigger live send', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toEqual('Email sent successfully');

        expect(res.body.data.data.id).toBeDefined();
        expect(typeof res.body.data.data.id).toBe('string');
      });
  });
});
