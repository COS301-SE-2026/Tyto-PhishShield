import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { LlmGatewayService } from './llm-gateway/llm-gateway.service';
import {
  Department,
  Difficulty,
  DifficultyLlmGenerationDto,
  MessageTone,
  MessageType,
  TemplateVariable,
} from './dto/difficulty-llm-generation.dto';

describe('LlmService', () => {
  let service: LlmService;

  const mockPromptBuilderService = {
    buildSystemPrompt: jest.fn(),
  };

  const mockLlmGatewayService = {
    send: jest.fn(),
  };

  // Mock ConfigService to return a specific LLM provider
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'LLM_PROVIDER') return 'test-llm-provider';
      return defaultValue;
    }),
  };

  const baseDto: DifficultyLlmGenerationDto = {
    difficulty: Difficulty.MEDIUM,
    tone: MessageTone.URGENT,
    messageType: MessageType.IT_SECURITY_ALERT,
    templateVariable: [TemplateVariable.NAME],
    count: 2,
    senderDepartment: Department.IT_SECURITY,
  };

  // Helper function to create a valid gateway response
  const createValidGatewayResponse = (subject: string, body: string) => ({
    choices: [
      {
        message: {
          content: JSON.stringify({ subject, body }),
        },
      },
    ],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: PromptBuilderService, useValue: mockPromptBuilderService },
        { provide: LlmGatewayService, useValue: mockLlmGatewayService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTemplates', () => {
    it('should successfully generate templates when all LLM calls return valid payloads', async () => {
      mockPromptBuilderService.buildSystemPrompt.mockReturnValue(
        'System prompt',
      );

      const validHtmlBody =
        '<p>Click <a href="{{tracking_link}}">here</a>.</p>';
      mockLlmGatewayService.send.mockResolvedValue(
        createValidGatewayResponse('Valid Subject', validHtmlBody),
      );

      const result = await service.generateTemplates(baseDto);

      expect(mockPromptBuilderService.buildSystemPrompt).toHaveBeenCalledWith(
        baseDto,
      );
      expect(mockLlmGatewayService.send).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        requested: 2,
        generated: 2,
        failed: 0,
        templates: [
          {
            id: expect.any(String) as string,
            subject: 'Valid Subject',
            body: validHtmlBody,
          },
          {
            id: expect.any(String) as string,
            subject: 'Valid Subject',
            body: validHtmlBody,
          },
        ],
      });
    });

    it('should handle partial failures and report correct counts', async () => {
      mockPromptBuilderService.buildSystemPrompt.mockReturnValue(
        'System prompt',
      );

      const validHtmlBody = '<a href="{{tracking_link}}">Link</a>';

      mockLlmGatewayService.send
        .mockResolvedValueOnce(
          createValidGatewayResponse('Success', validHtmlBody),
        )
        // Simulate a partial failure
        .mockRejectedValueOnce(new Error('API Rate Limit'));

      const result = await service.generateTemplates(baseDto);

      expect(result.requested).toBe(2);
      expect(result.generated).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.templates).toHaveLength(1);
    });

    it('should fail template validation if the tracking link anchor is missing', async () => {
      mockPromptBuilderService.buildSystemPrompt.mockReturnValue(
        'System prompt',
      );

      const invalidHtmlBody = '<p>No link</p>';
      mockLlmGatewayService.send.mockResolvedValue(
        createValidGatewayResponse('Valid Subject', invalidHtmlBody),
      );

      await expect(service.generateTemplates(baseDto)).rejects.toThrow(
        'No templates generated',
      );
    });

    it('should fail template validation if the JSON is malformed', async () => {
      mockPromptBuilderService.buildSystemPrompt.mockReturnValue(
        'System prompt',
      );

      mockLlmGatewayService.send.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'INVALID_JSON_STRING',
            },
          },
        ],
      });

      await expect(service.generateTemplates(baseDto)).rejects.toThrow(
        'No templates generated',
      );
    });

    it('should throw an error if all requests are completely rejected', async () => {
      mockPromptBuilderService.buildSystemPrompt.mockReturnValue(
        'System prompt',
      );
      mockLlmGatewayService.send.mockRejectedValue(new Error('Network Error'));

      await expect(service.generateTemplates(baseDto)).rejects.toThrow(
        'No templates generated',
      );
    });
  });
});
