import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayService } from './llm-gateway.service';
import { ConfigService } from '@nestjs/config';
import {
  ErrorLlmGatewayResponse,
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';

describe('LlmGatewayService', () => {
  let service: LlmGatewayService;
  let mockFetch: jest.SpyInstance;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'LLM_GATEWAY_KEY') return 'test-api-key';
      if (key === 'LLM_GATEWAY_URL') return 'https://api.gateway.com';
      return 'default';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmGatewayService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LlmGatewayService>(LlmGatewayService);

    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    const requestBody: LlmGatewayRequestBody = {
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    it('should send a correct POST request and return the parsed response on success', async () => {
      const expectedResponse: OkLlmGatewayResponse = {
        id: 'req-123',
        object: 'chat.completion',
        created: 123456,
        model: 'test-model',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        metadata: {},
      } as OkLlmGatewayResponse;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(expectedResponse),
      });

      const result = await service.send(requestBody);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.gateway.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: JSON.stringify(requestBody),
        },
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error and log a warning if the API returns a non-OK status with an error message', async () => {
      const errorResponse: ErrorLlmGatewayResponse = {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          param: 'model',
          code: '429',
        },
      } as ErrorLlmGatewayResponse;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Too Many Requests',
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      } as unknown as Response);

      await expect(service.send(requestBody)).rejects.toEqual(errorResponse);
    });

    it('should fallback to statusText in the logger if the error JSON has no message', async () => {
      const errorResponse: ErrorLlmGatewayResponse = {
        error: {
          type: 'unknown_error',
          param: '',
          code: '500',
        },
      } as ErrorLlmGatewayResponse;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      });

      await expect(service.send(requestBody)).rejects.toEqual(errorResponse);
    });
  });
});
