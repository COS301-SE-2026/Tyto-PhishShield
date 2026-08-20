import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayService } from './llm-gateway.service';

describe('LlmGatewayService', () => {
  let service: LlmGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmGatewayService],
    }).compile();

    service = module.get<LlmGatewayService>(LlmGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
