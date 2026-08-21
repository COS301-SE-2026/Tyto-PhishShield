import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayService } from './llm-gateway.service';
import { ConfigService } from '@nestjs/config';

describe('LlmGatewayService', () => {
  let service: LlmGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<LlmGatewayService>(LlmGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
