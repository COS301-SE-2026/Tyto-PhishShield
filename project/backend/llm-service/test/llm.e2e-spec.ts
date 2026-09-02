import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { LlmController } from '../src/llm/llm.controller';
import { LlmService } from '../src/llm/llm.service';
import { PromptBuilderService } from '../src/llm/prompt-builder/prompt-builder.service';
import { LlmGatewayService } from '../src/llm/llm-gateway/llm-gateway.service';
import {
  Difficulty,
  MessageTone,
  MessageType,
  TemplateVariable,
} from '../src/llm/dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from '../src/llm/dto/generated-templates-response.dto';

describe('LlmController (e2e, real gateway)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
      ],
      controllers: [LlmController],
      providers: [LlmService, PromptBuilderService, LlmGatewayService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /llm/difficulty_generation returns generated templates', async () => {
    const response = await request(app.getHttpServer())
      .post('/llm/difficulty_generation')
      .send({
        difficulty: Difficulty.MEDIUM,
        tone: MessageTone.PROFESSIONAL,
        messageType: MessageType.IT_SUPPORT,
        templateVariable: [TemplateVariable.NAME, TemplateVariable.DEPARTMENT],
        count: 2,
      });

    if (response.status !== 200) {
      console.error('Validation/Server Error Details:', response.body);
    }

    const body = response.body as GeneratedTemplatesResponseDto;

    console.log(JSON.stringify(response.body, null, 2));

    expect(body.templates.length).toBeGreaterThan(0);
    expect(body.templates[0]).toHaveProperty('subject');
    expect(body.templates[0]).toHaveProperty('body');
  }, 30000);
});
