import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { LlmGatewayService } from '../src/llm/llm-gateway/llm-gateway.service';

/**
 * Connectivity smoke test of Local LLM.
 */
describe('Local LLM connectivity (e2e)', () => {
  let moduleRef: TestingModule;
  let llmGatewayService: LlmGatewayService;
  const localLlmUrl = process.env.LOCAL_LLM_URL ?? 'http://localhost:11434';

  beforeAll(async () => {
    console.log(`[connectivity] LOCAL_LLM_URL resolved to: ${localLlmUrl}`);

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
        }),
      ],
      providers: [LlmGatewayService],
    }).compile();

    llmGatewayService = moduleRef.get(LlmGatewayService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  function consoleLogErrors(err: Error | any) {
    console.error(`[connectivity] sendLocal FAILED`);
    console.error(`  name: ${(err as Error)?.name}`);
    console.error(`  message: ${(err as Error)?.message}`);

    const cause = (err as any)?.cause;
    console.error(`  cause: ${cause?.message ?? cause}`);
    console.error(`  cause.code: ${cause?.code}`);
    if (Array.isArray(cause?.errors)) {
      cause.errors.forEach((e: any, i: number) => console.error(`  cause.errors[${i}]: ${e?.code} ${e?.message}`),
      );
    }
    throw err;
  }

  it('LOCAL_LLM_URL is reachable at the network level', async () => {
    try {
      const res = await fetch(`${localLlmUrl}/api/tags`);
      console.log(`[connectivity] raw fetch status: ${res.status}`);

      const body = await res.text();
      console.log(`[connectivity] raw fetch body: ${body}`);

      expect(res.ok).toBe(true);
    } catch (err) {
      consoleLogErrors(err);
    }
  }, 10000);

  it('can reach the local Ollama instance via LlmGatewayService and get a non-empty response', async () => {
    const model = process.env.LOCAL_LLM_MODEL ?? 'gemma2:2b';
    console.log(`[connectivity] model value (raw): ${JSON.stringify(model)}`);
    console.log(`[connectivity] model length: ${model.length}`);

    try {
      const response = await llmGatewayService.sendLocal({
        model,
        messages: [
          { role: 'user', content: 'Reply with the single word: pong' },
        ],
      });

      console.log(`[connectivity] raw response: ${response}`);

      expect(typeof response).toBe('string');
      expect(response.trim().length).toBeGreaterThan(0);
    } catch (err) {
      consoleLogErrors(err);
    }
  }, 30000);
});