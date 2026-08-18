/* eslint-disable @typescript-eslint/no-unsafe-argument, prettier/prettier */
// TODO fix the eslint errors

/**
 * Service: waves-service
 *
 * End-to-end integration tests for batch email operations.
 * Boots the full NestJS application, seeds an email template directly into the database in beforeAll,
 * and runs requests against a live database and Resend API connection.
 *
 * Tests:
 * - POST /batch-emails/send-batch-random-same-email (with referenceNumber) - Sends one template to all recipients immediately; also tests 404 for unknown reference.
 * - POST /batch-emails/send-batch-random-same-email - Sends the same random template to all recipients; tests shared time, independent random times, and invalid date range (400).
 * - POST /batch-emails/send-batch-random-different-email - Sends a different random template per recipient; tests shared time, independent random times, and invalid date range (400).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import {
  EmailDifficulty,
  EmailTemplateEntity,
} from '../src/entities/email-template.entity';
import { UserEntity } from '../src/entities/user.entity';
import { In, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const TEST_SENDER = `test@${process.env.DOMAIN}`;
const TEST_RECIPIENT_EMAIL = process.env.RESEND_EMAIL_DELIVERED;
const TEST_RECIPIENTS = [
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_EMAIL,
];
const TEST_AUTH0_IDS = [
  'auth0|batch-e2e-1',
  'auth0|batch-e2e-2',
  'auth0|batch-e2e-3',
];
const TEST_WAVE_NAME = 'e2e-test-wave';

describe('BatchEmail service integration tests', () => {
  let app: INestApplication;
  let testReferenceNumber: string;
  let userRepository: Repository<UserEntity>;
  let emailTemplateRepository: Repository<EmailTemplateEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    emailTemplateRepository = moduleFixture.get<Repository<EmailTemplateEntity>>(
      getRepositoryToken(EmailTemplateEntity),
    );

    // Seed test users
    await userRepository.save(
      TEST_AUTH0_IDS.map((auth0Id) => ({
        auth0Id,
        name: 'Batch E2E Test User',
        email: TEST_RECIPIENT_EMAIL,
      })),
    );

    testReferenceNumber = `PHISH-E2E-${Date.now()}`;
    await emailTemplateRepository.save({
      referenceNumber: testReferenceNumber,
      sender: TEST_SENDER,
      alias: 'Batch E2E Tester',
      subject: 'Batch E2E Test',
      content: '<p>Batch e2e test email</p>',
      difficulty: EmailDifficulty.MEDIUM,
    });

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await userRepository.delete({ auth0Id: In(TEST_AUTH0_IDS) });
    await emailTemplateRepository.delete({
      referenceNumber: testReferenceNumber,
    });

    const ampqConnection = app.get(AmqpConnection);
    if (ampqConnection) {
      await ampqConnection.managedConnection.close();
    }
    await app.close();
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should send a specific template to all recipients when referenceNumber is provided`, () => {
    const scheduledAt = new Date();
    const scheduledAtIso = scheduledAt.toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
        referenceNumber: testReferenceNumber,
      })
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(true);
        expect(body.message).toContain(`${TEST_RECIPIENTS.length}`);
      });
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should return 404 for unknown reference`, () => {
    const scheduledAtIso = new Date().toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
        referenceNumber: 'NON-EXISTENT-REF',
      })
      .expect(404);
  });

  it(`/batch-emails/send-batch-random-same-email (POST) - should schedule the same random template to all recipients at a shared future time`, () => {
    const scheduledAt = new Date();
    const scheduledAtIso = scheduledAt.toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-same-email`)
      .send({
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
      })
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(true);
        expect(body.message).toContain(`${TEST_RECIPIENTS.length}`);
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
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: true,
        waveName: TEST_WAVE_NAME,
      })
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(true);
        expect(body.message).toContain(`${TEST_RECIPIENTS.length}`);
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
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
      })
      .expect(400);
  });

  it(`/batch-emails/send-batch-random-different-email (POST) - should schedule a different random template per recipient at a shared future time`, () => {
    const scheduledAt = new Date();
    const scheduledAtIso = scheduledAt.toISOString();

    return request(app.getHttpServer())
      .post(`/batch-emails/send-batch-random-different-email`)
      .send({
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledAtIso,
        scheduledTo: scheduledAtIso,
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
      })
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(true);
        expect(body.message).toContain(`${TEST_RECIPIENTS.length}`);
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
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: true,
        waveName: TEST_WAVE_NAME,
      })
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(true);
        expect(body.message).toContain(`${TEST_RECIPIENTS.length}`);
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
        auth0Id: TEST_AUTH0_IDS,
        difficulty: EmailDifficulty.MEDIUM,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        randomisedTimes: false,
        waveName: TEST_WAVE_NAME,
      })
      .expect(400);
  });
});