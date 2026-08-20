import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayController } from './llm-gateway.controller';
import { LlmGatewayService } from './llm-gateway.service';

describe('LlmGatewayController', () => {
  let controller: LlmGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmGatewayController],
      providers: [LlmGatewayService],
    }).compile();

    controller = module.get<LlmGatewayController>(LlmGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
