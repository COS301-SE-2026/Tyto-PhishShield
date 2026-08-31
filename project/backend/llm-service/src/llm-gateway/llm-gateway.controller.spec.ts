import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayController } from './llm-gateway.controller';
import { LlmGatewayService } from './llm-gateway.service';
import { ConfigService } from '@nestjs/config';

describe('LlmGatewayController', () => {
  let controller: LlmGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmGatewayController],
      providers: [
        LlmGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => {
              return 'envVariable';
            }),
            getOrThrow: jest.fn(() => {
              return 'envVariable';
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<LlmGatewayController>(LlmGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
