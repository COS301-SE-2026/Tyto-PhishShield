/**
 * Service: mailing-service
 *
 * End-to-end integration tests for single email operations.
 * Boots the full NestJS application and runs requests against a live database and Resend API connection.
 *
 * Tests:
 * - POST /emails - Creates a new email record and captures the reference number.
 * - GET /emails - Retrieves all email records.
 * - GET /emails/:referenceNumber - Fetches a specific email by reference number.
 * - PATCH /emails/:referenceNumber - Updates fields on an existing email record.
 * - POST /emails/:referenceNumber/send-single - Immediately dispatches an email via Resend.
 * - POST /emails/:referenceNumber/schedule-send-single - Schedules an email for future delivery via Resend.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, } from '@nestjs/common';
import request from 'supertest';
import { MailingServiceModule } from '../src/mailing-service.module';
import {
  EmailDifficulty,
  EmailTemplateEntity,
} from '../src/entities/email-template.entity';
import { In, Repository } from 'typeorm';
import { Department, UserEntity } from '../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const TEST_SENDER_DOMAIN = process.env.DOMAIN;
const TEST_RECIPIENT = process.env.RESEND_EMAIL_DELIVERED;
const TEST_AUTH0_ID = 'auth0|1';
const TEST_SENDER_AUTH0_ID = 'auth0|1-sender'

describe('Email service integration test', () => {
  let app: INestApplication;
  let testReferenceNumber: string;
  let userRepository: Repository<UserEntity>;
  let emailTemplateRepository: Repository<EmailTemplateEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailingServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    )

    emailTemplateRepository = moduleFixture.get<Repository<EmailTemplateEntity>>(
      getRepositoryToken(EmailTemplateEntity),
    )

    await userRepository.save([
      userRepository.create({
        auth0Id: TEST_AUTH0_ID,
        name: 'E2e Test User',
        email: TEST_RECIPIENT,
        department: Department.FINANCE,
      }),
      userRepository.create({
        auth0Id: TEST_SENDER_AUTH0_ID,
        name: 'E2e Test sender',
        email: `sender@${TEST_SENDER_DOMAIN}`,
        department: Department.IT_SECURITY,
      })
    ]);
  }, 30000);

  afterAll(async () => {
    await emailTemplateRepository.delete({ sender: TEST_SENDER_AUTH0_ID });
    await userRepository.delete({ auth0Id: In([TEST_SENDER_AUTH0_ID, TEST_AUTH0_ID ]) });
    await app.close();
  });

  it('/emails (POST) - should create a new email', () => {
    return request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER_DOMAIN,
        subject: 'E2E Test',
        content: '<p>This is a test</p>',
        difficulty: EmailDifficulty.MEDIUM,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.referenceNumber).toBeDefined();
        testReferenceNumber = res.body.referenceNumber;
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
        expect(res.body.referenceNumber).toEqual(testReferenceNumber);
      });
  });

  it('/emails/:referenceNumber (GET) - should throw 404 for unknows reference', () => {
    return request(app.getHttpServer())
      .get('/emails/PHISH-NOTAREF')
      .expect(404);
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

  it('/emails/:referenceNumber/send-single (POST) - should send email via Resend', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({
        auth0Id: TEST_AUTH0_ID,
        senderName: 'E2e-sender',
        alias: 'E2e Tester',
      })
      .expect((res) => {
        console.log('BODY:', JSON.stringify(res.body));
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('sent instantly.');
        expect(res.body.deliveryId).toBeDefined();
      });
  });

  it('/emails/:referenceNumber/send-single (POST) - should send via a randomly selected sender when senderName is not included', () => {
  return request(app.getHttpServer())
    .post(`/emails/${testReferenceNumber}/send-single`)
    .send({ auth0Id: TEST_AUTH0_ID })
    .expect(200)
    .expect((res) => {
      expect(res.body.success).toBe(true);
      expect(res.body.deliveryId).toBeDefined();
    });
  });

  it('/emails/:referneceNumber/send-single (POST) - should throw error if user auth0Id does not exist', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({ auth0Id: 'auth0|non-existent' })
      .expect(500);
  });

  it('/emails/:referenceNumber/schedule-send-single (POST) - should schedule email via Resend', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);

    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/schedule-send-single`)
      .send({
        auth0Id: TEST_AUTH0_ID,
        scheduledAt: futureDate.toISOString(),
        senderName: 'E2e-sender',
        alias: 'E2e tester',
      })
      .expect(200)
      .expect((res) => {
        console.log('BODY:', JSON.stringify(res.body));
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('successfully scheduled');
        expect(res.body.deliveryId).toBeDefined();
      });
  });

  it('/emails/:referenceNumber/schedule-send-single (POST) - should send via a randomly selected sender when senderName is omitted', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, scheduledAt: futureDate.toISOString() })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.deliveryId).toBeDefined();
      });
  });

  it('/emails/:referneceNumber/schedule-send-single (POST) - should throw error if user auth0Id does not exist', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);

    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/schedule-send-single`)
      .send({
        auth0Id: 'auth0|non-existent',
        scheduledAt: futureDate.toISOString(),
      })
      .expect(500);
  });

  it('/emails/:referenceNumber/send-single (POST) - should substitute supported variables and send successfully', async () => {
  const createRes = await request(app.getHttpServer())
    .post('/emails')
    .send({
      sender: TEST_SENDER_DOMAIN,
      subject: 'Hi {{name}}',
      content: '<p>Hello {{name}} from {{department}} at {{business_name}}. Click {{tracking_link}}.</p>',
      difficulty: EmailDifficulty.MEDIUM,
    })
    .expect(201);

  return request(app.getHttpServer())
    .post(`/emails/${createRes.body.referenceNumber}/send-single`)
    .send({ auth0Id: TEST_AUTH0_ID, senderName: 'e2e-sender' })
    .expect(200)
    .expect((res) => expect(res.body.success).toBe(true));
});

  it('/emails/:referenceNumber/send-single (POST) - should fail when the template contains an unsupported variable', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER_DOMAIN,
        subject: 'Test',
        content: '<p>Hello {{incorrectVariable}}</p>',
        difficulty: EmailDifficulty.MEDIUM,
      })
      .expect(201);

    return request(app.getHttpServer())
      .post(`/emails/${createRes.body.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderName: 'e2e-sender' })
      .expect(500);
  });

  it('/emails/:referenceNumber/send-single (POST) - should fail when senderDepartment has no sender available', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER_DOMAIN,
        subject: 'Test',
        content: '<p>Test</p>',
        difficulty: EmailDifficulty.MEDIUM,
        senderDepartment: Department.LEGAL_COMPLIANCE,
      })
      .expect(201);

    return request(app.getHttpServer())
      .post(`/emails/${createRes.body.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID })
      .expect(500);
  });
});
