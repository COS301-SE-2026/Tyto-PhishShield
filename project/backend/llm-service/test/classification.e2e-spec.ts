import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { LlmController } from '../src/llm/llm.controller';
import { LlmService } from '../src/llm/llm.service';
import { PromptBuilderService } from '../src/llm/prompt-builder/prompt-builder.service';
import { LlmGatewayService } from '../src/llm/llm-gateway/llm-gateway.service';
import { ClassificationService } from '../src/llm/classification/classification.service';
import {
  ReplyClassificationDto,
  MistakeCategory,
  Severity,
} from '../src/llm/dto/reply-classification.dto';

interface ClassificationCase {
  name: string;
  replyText: string;
  originalSubject?: string;
  expectedCategories: MistakeCategory[];
}

interface CaseResult {
  name: string;
  status: number;
  categories: string[];
  confidence: number;
  severity: string;
  needsReview: boolean;
  expected: string[];
  matched: boolean;
}

const CASES: ClassificationCase[] = [
  {
    name: 'clean / suspicious refusal',
    replyText:
      "This looks off, I'm not giving out any info over email. I'll check with the helpdesk directly.",
    originalSubject: 'Urgent: Verify your account',
    expectedCategories: [MistakeCategory.VALID_RESPONSE],
  },
  {
    name: 'plain non-answer',
    replyText: 'Who is this? I did not request anything.',
    originalSubject: 'Password reset required',
    expectedCategories: [MistakeCategory.VALID_RESPONSE],
  },
  {
    name: 'login details leaked',
    replyText: 'Sure, my username is jdoe and my password is Winter2025!',
    originalSubject: 'IT Support: Password reset required',
    expectedCategories: [MistakeCategory.LOGIN_DETAILS_LEAKED],
  },
  {
    name: 'secrets leaked',
    replyText:
      "Here's the internal API key you asked for: sk_live_51Hh3f9zA. Let me know if you need the staging one too.",
    originalSubject: 'DevOps: Need the prod key for deployment',
    expectedCategories: [MistakeCategory.SECRETS_LEAKED],
  },
  {
    name: 'pii leaked',
    replyText:
      'To confirm my identity: my ID number is 9203015800086 and I live at 12 Baker Street, Pretoria.',
    originalSubject: 'HR: Confirm your details for payroll',
    expectedCategories: [MistakeCategory.PII_LEAKED],
  },
  {
    name: 'financial info leaked',
    replyText: 'My card number is 4111 1111 1111 1111, expiry 08/27, cvv 123.',
    originalSubject: 'Finance: Update your payment method',
    expectedCategories: [MistakeCategory.FINANCIAL_INFO_LEAKED],
  },
  {
    name: 'multi-label: login + secrets',
    replyText:
      "Password is hunter2 and here's the API token: tok_9f8a7b6c5d4e",
    originalSubject: 'Access request',
    expectedCategories: [
      MistakeCategory.LOGIN_DETAILS_LEAKED,
      MistakeCategory.SECRETS_LEAKED,
    ],
  },
];

describe('Classification E2E Testing', () => {
  let app: INestApplication;
  const results: CaseResult[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
      ],
      controllers: [LlmController],
      providers: [
        LlmService,
        PromptBuilderService,
        LlmGatewayService,
        ClassificationService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    console.log(' Classification E2E: starting run');
    console.log(` Cases to run: ${CASES.length}`);
  });

  afterAll(async () => {
    console.log(' Reply Classification E2E: summary');

    console.table(
      results.map((r) => ({
        Case: r.name,
        Status: r.status,
        'Got categories': r.categories.join(', ') || '(none)',
        Expected: r.expected.join(', '),
        Match: r.matched ? 'YES' : 'NO',
        Confidence: r.confidence,
        Severity: r.severity,
        NeedsReview: r.needsReview,
      })),
    );

    const passed = results.filter((r) => r.matched).length;
    const flagged = results.filter((r) => r.needsReview).length;
    console.log(
      `\n${passed}/${results.length} cases matched their expected category set exactly.`,
    );
    if (flagged > 0) {
      console.log(
        `${flagged} case(s) fell back to needs_review (low confidence or invalid model output)`,
      );
    }

    await app.close();
  }, 30000);

  it.each(CASES)(
    'classifies: $name',
    async ({ name, replyText, originalSubject, expectedCategories }) => {

      const response = await request(app.getHttpServer())
        .post('/llm/classify_reply')
        .send({ replyText, originalSubject });

      console.log(`HTTP status: ${response.status}`);
      console.log(`Raw response body: ${JSON.stringify(response.body, null, 2)}`);

      expect(response.status).toBe(200);

      const body = response.body as ReplyClassificationDto;

      expect(Array.isArray(body.categories)).toBe(true);
      expect(typeof body.confidence).toBe('number');
      expect(body.confidence).toBeGreaterThanOrEqual(0);
      expect(body.confidence).toBeLessThanOrEqual(1);
      expect(Object.values(Severity)).toContain(body.severity);
      expect(typeof body.needsReview).toBe('boolean');

      const matched =
        body.categories.length === expectedCategories.length &&
        expectedCategories.every((c) => body.categories.includes(c));

      console.log(
        matched
          ? `MATCH: got exactly the expected categories`
          : `MISMATCH: expected [${expectedCategories.join(', ')}], got [${body.categories.join(', ')}]`,
      );

      results.push({
        name,
        status: response.status,
        categories: body.categories,
        confidence: body.confidence,
        severity: body.severity,
        needsReview: body.needsReview,
        expected: expectedCategories,
        matched,
      });
    },
    90000,
  );
});