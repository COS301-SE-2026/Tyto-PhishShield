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
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { MailingServiceModule } from '../src/mailing-service.module';
import { EmailDifficulty } from '../src/entities/email-template.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const TEST_SENDER = `test@${process.env.DOMAIN}`;
const TEST_RECIPIENT = process.env.RESEND_EMAIL_DELIVERED;
const TEST_AUTH0_ID = 'auth0|1';

describe('Email service integration test', () => {
  let app: INestApplication;
  let testReferenceNumber: string;
  let userRepository: Repository<UserEntity>;

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

    await userRepository.save(
      userRepository.create({
        auth0Id: TEST_AUTH0_ID,
        name: 'E2e Test User',
        email: TEST_RECIPIENT,
      }),
    );
  }, 30000);

  afterAll(async () => {
    await userRepository.delete({ auth0Id: TEST_AUTH0_ID });
    await app.close();
  });

  it('/emails (POST) - should create a new email', () => {
    return request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER,
        alias: 'E2E Tester',
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
      .send({ auth0Id: TEST_AUTH0_ID })
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
      })
      .expect(200)
      .expect((res) => {
        console.log('BODY:', JSON.stringify(res.body));
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('successfully scheduled');
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
});
