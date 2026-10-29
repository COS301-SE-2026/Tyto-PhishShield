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
 * - Template variable validation - POST/PATCH /emails reject unknown or malformed {{variables}} with 400;
 *   sending a template that already contains one (seeded directly in the DB) also returns 400.
 * - DELETE /emails/:referenceNumber - Deletes a template; 404 for an unknown reference.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import { MailingServiceModule } from '../src/mailing-service.module';
import { EmailDifficulty, EmailTemplateEntity, } from '../src/entities/email-template.entity';
import { In, Repository } from 'typeorm';
import { Department, UserEntity, UserRole } from '../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeInfoEntity } from '../src/entities/employee-info.entity';

const TEST_SENDER_DOMAIN = process.env.DOMAIN;
const TEST_RECIPIENT = process.env.RESEND_EMAIL_DELIVERED;
const TEST_AUTH0_ID = 'auth0|1';
const TEST_SENDER_AUTH0_ID = 'auth0|1-sender'

describe('Email service integration test', () => {
  let app: INestApplication;
  let testReferenceNumber: string;
  let userRepository: Repository<UserEntity>;
  let emailTemplateRepository: Repository<EmailTemplateEntity>;
  let employeeInfoRepository: Repository<EmployeeInfoEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MailingServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );

    emailTemplateRepository = moduleFixture.get<
      Repository<EmailTemplateEntity>
    >(getRepositoryToken(EmailTemplateEntity));

    employeeInfoRepository = moduleFixture.get<
      Repository<EmployeeInfoEntity>
    >(getRepositoryToken(EmployeeInfoEntity));

    await emailTemplateRepository.delete({ sender: TEST_SENDER_DOMAIN });

    await userRepository.save([
      userRepository.create({
        auth0Id: TEST_AUTH0_ID,
        name: 'E2e Test User',
        firstName: 'E2E_first',
        lastName: 'E2E_last',
        email: TEST_RECIPIENT,
        department: Department.FINANCE,
        role: UserRole.USER,
      }),
      userRepository.create({
        auth0Id: TEST_SENDER_AUTH0_ID,
        name: 'E2e Test sender',
        firstName: 'E2E_first',
        lastName: 'E2E_last',
        email: `sender@${TEST_SENDER_DOMAIN}`,
        department: Department.IT_SECURITY,
        role: UserRole.USER,
      }),
    ]);

  await employeeInfoRepository.save([
    employeeInfoRepository.create({
      auth0Id: TEST_AUTH0_ID,
      jobTitle: 'Engineer',
      title: 'Mr',
    }),
    employeeInfoRepository.create({
      auth0Id: TEST_SENDER_AUTH0_ID,
      jobTitle: 'Manager',
      title: 'Mrs',
    }),
  ]);
  }, 30000);

  afterAll(async () => {
    await emailTemplateRepository.delete({ sender: TEST_SENDER_DOMAIN });
    await userRepository.delete({
      auth0Id: In([TEST_SENDER_AUTH0_ID, TEST_AUTH0_ID]),
    });
    await employeeInfoRepository.delete({
      auth0Id: In([TEST_AUTH0_ID, TEST_SENDER_AUTH0_ID]),
    });
    await app.close();
  });

  // Helper Function to create email template
  function createEmailTemplate(overrides: Partial<{
    sender: string;
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
    senderDepartment: Department;
  }> = {}) {
    return request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER_DOMAIN,
        subject: 'E2E Test',
        content: '<p>This is a test</p>',
        difficulty: EmailDifficulty.HARD,
        ...overrides,
      });
  }

  function seedTemplateBypassingValidation(overrides: Partial<{
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
  }> = {}) {
    return emailTemplateRepository.save(
      emailTemplateRepository.create({
        referenceNumber: `PHISH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        sender: TEST_SENDER_DOMAIN,
        subject: 'Test',
        content: '<p>Test</p>',
        difficulty: EmailDifficulty.HARD,
        ...overrides,
      }),
    );
  }

  // Helper Function to expect success
  function expectSuccess(res: request.Response) {
    expect(res.body.success).toBe(true);
  }

  // Helper Function to expect success and deliveredId to be defined
  function expectSuccessWithDeliveryId(res: request.Response) {
    expect(res.body.success).toBe(true);
    expect(res.body.deliveryId).toBeDefined();
  }

  it('/emails (POST) - should create a new email', () => {
    return request(app.getHttpServer())
      .post('/emails')
      .send({
        sender: TEST_SENDER_DOMAIN,
        subject: 'E2E Test',
        content: '<p>This is a test</p>',
        difficulty: EmailDifficulty.HARD,
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
        senderCustomName: 'E2e-sender',
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
    .expect(expectSuccessWithDeliveryId);
  });

  it('/emails/:referneceNumber/send-single (POST) - should throw error if user auth0Id does not exist', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({ auth0Id: 'auth0|non-existent' })
      .expect(404);
  });

  it('/emails/:referenceNumber/send-single (POST) - should send using an explicit senderAuth0Id', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderAuth0Id: TEST_SENDER_AUTH0_ID })
      .expect(200)
      .expect(expectSuccessWithDeliveryId);
  });

  it('/emails/:referenceNumber/send-single (POST) - should return 400 when both senderCustomName and senderAuth0Id are provided', () => {
    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/send-single`)
      .send({
        auth0Id: TEST_AUTH0_ID,
        senderCustomName: 'e2e-sender',
        senderAuth0Id: TEST_SENDER_AUTH0_ID,
      })
      .expect(400);
  });

  it('/emails/:referenceNumber/schedule-send-single (POST) - should schedule email via Resend', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);

    return request(app.getHttpServer())
      .post(`/emails/${testReferenceNumber}/schedule-send-single`)
      .send({
        auth0Id: TEST_AUTH0_ID,
        scheduledAt: futureDate.toISOString(),
        senderCustomName: 'E2e-sender',
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
      .post(`/emails/${testReferenceNumber}/schedule-send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, scheduledAt: futureDate.toISOString() })
      .expect(200)
      .expect(expectSuccessWithDeliveryId);
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
      .expect(404);
  });

  it('/emails/:referenceNumber/send-single (POST) - should substitute supported variables and send successfully', async () => {
    const createRes = await createEmailTemplate({
      subject: 'Hi {{name}}',
      content: '<p>Hello {{name}} from {{department}} at {{business_name}}. Click {{tracking_link}}.</p>',
    }).expect(201);

    return request(app.getHttpServer())
      .post(`/emails/${createRes.body.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderCustomName: 'e2e-sender' })
      .expect(200)
      .expect(expectSuccess);
  });

  it('/emails/:referenceNumber/send-single (POST) - should substitute employee info variables and send successfully', async () => {
    const createRes = await createEmailTemplate({
      subject: 'Hi {{name}}, {{title}}',
      content: '<p>Your role is {{job_title}} in {{department}} at {{business_name}}.</p>',
    }).expect(201);

    return request(app.getHttpServer())
      .post(`/emails/${createRes.body.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderCustomName: 'e2e-sender' })
      .expect(200)
      .expect(expectSuccess);
  });

  it('/emails/:referenceNumber/send-single (POST) - should return 400 when a stored template contains an unsupported variable', async () => {
    const template = await seedTemplateBypassingValidation({
      content: '<p>Hello {{incorrectVariable}}</p>',
    });

    return request(app.getHttpServer())
      .post(`/emails/${template.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderCustomName: 'e2e-sender' })
      .expect(400);
  });

  it('/emails/:referenceNumber/send-single (POST) - should return 400 when a stored template contains a malformed placeholder', async () => {
    const template = await seedTemplateBypassingValidation({
      subject: 'Hi {{first-name}}',
    });

    return request(app.getHttpServer())
      .post(`/emails/${template.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID, senderCustomName: 'e2e-sender' })
      .expect(400);
  });

  it('/emails (POST) - should return 400 and not save when the content contains an unsupported variable', async () => {
    const subject = 'E2E unsupported variable in content';

    await createEmailTemplate({
      subject,
      content: '<p>Hello {{incorrectVariable}}</p>',
    })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('incorrectVariable');
      });

    expect(await emailTemplateRepository.findOne({ where: { subject } })).toBeNull();
  });

  it('/emails (POST) - should return 400 and not save when the subject contains an unsupported variable', async () => {
    const subject = 'E2E unsupported {{incorrectVariable}} in subject';

    await createEmailTemplate({ subject, content: '<p>Fine</p>' }).expect(400);

    expect(await emailTemplateRepository.findOne({ where: { subject } })).toBeNull();
  });

  it('/emails (POST) - should list every unsupported variable in the error message', () => {
    return createEmailTemplate({
      subject: 'E2E multiple unsupported variables',
      content: '<p>{{foo}} and {{bar}}</p>',
    })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('foo');
        expect(res.body.message).toContain('bar');
      });
  });

  it('/emails (POST) - should return 400 for malformed placeholders such as {{first-name}} or {{}}', async () => {
    await createEmailTemplate({
      subject: 'E2E malformed hyphen',
      content: '<p>Hello {{first-name}}</p>',
    }).expect(400);

    await createEmailTemplate({
      subject: 'E2E malformed empty',
      content: '<p>Hello {{}}</p>',
    }).expect(400);
  });

  it('/emails (POST) - should accept every supported variable, including the reserved tracking_link', () => {
    return createEmailTemplate({
      subject: 'E2E all variables {{name}} {{surname}}',
      content:
        '<p>{{name}} {{surname}} {{department}} {{job_title}} {{title}} {{business_name}} {{tracking_link}}</p>',
    }).expect(201);
  });

  it('/emails/:referenceNumber (PATCH) - should return 400 and leave the template unchanged when updating to an unsupported variable', async () => {
    const createRes = await createEmailTemplate({
      subject: 'E2E patch original subject',
      content: '<p>Original</p>',
    }).expect(201);
    const reference = createRes.body.referenceNumber;

    await request(app.getHttpServer())
      .patch(`/emails/${reference}`)
      .send({ content: '<p>Hello {{incorrectVariable}}</p>' })
      .expect(400);

    await request(app.getHttpServer())
      .get(`/emails/${reference}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.content).toEqual('<p>Original</p>');
      });
  });

  it('/emails/:referenceNumber (PATCH) - should accept an update that uses supported variables', async () => {
    const createRes = await createEmailTemplate({
      subject: 'E2E patch supported variables',
      content: '<p>Original</p>',
    }).expect(201);

    return request(app.getHttpServer())
      .patch(`/emails/${createRes.body.referenceNumber}`)
      .send({ subject: 'Hi {{name}}', content: '<p>{{department}} {{tracking_link}}</p>' })
      .expect(200)
      .expect((res) => {
        expect(res.body.subject).toEqual('Hi {{name}}');
      });
  });

  it('/emails/:referenceNumber (PATCH) - should still allow updating other fields on a template that already contains a bad variable', async () => {
    const template = await seedTemplateBypassingValidation({
      content: '<p>Hello {{legacyVariable}}</p>',
    });

    return request(app.getHttpServer())
      .patch(`/emails/${template.referenceNumber}`)
      .send({ difficulty: EmailDifficulty.EASY })
      .expect(200);
  });

  it('/emails/:referenceNumber (DELETE) - should delete an existing template', async () => {
    const createRes = await createEmailTemplate({
      subject: 'E2E delete me',
    }).expect(201);

    await request(app.getHttpServer())
      .delete(`/emails/${createRes.body.referenceNumber}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/emails/${createRes.body.referenceNumber}`)
      .expect(404);
  });

  it('/emails/:referenceNumber (DELETE) - should return 404 for an unknown reference', () => {
    return request(app.getHttpServer())
      .delete('/emails/PHISH-NOTAREF')
      .expect(404);
  });

  it('/emails/:referenceNumber/send-single (POST) - should return 404 when senderDepartment has no sender available', async () => {
    const createRes = await createEmailTemplate({
      subject: 'Test',
      content: '<p>Test</p>',
      senderDepartment: Department.LEGAL_COMPLIANCE,
    }).expect(201);

    return request(app.getHttpServer())
      .post(`/emails/${createRes.body.referenceNumber}/send-single`)
      .send({ auth0Id: TEST_AUTH0_ID })
      .expect(404);
  });
});