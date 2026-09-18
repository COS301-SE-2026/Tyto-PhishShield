import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import {
  Department,
  Difficulty,
  DifficultyLlmGenerationDto,
  MessageTone,
  MessageType,
  TemplateVariable,
} from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';

describe('LlmController', () => {
  let controller: LlmController;

  const mockLlmService = {
    generateTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        {
          provide: LlmService,
          useValue: mockLlmService,
        },
      ],
    }).compile();

    controller = module.get<LlmController>(LlmController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('difficultyGeneration', () => {
    it('should pass the DTO to the service and return templates', async () => {
      const requestDto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.MEDIUM,
        tone: MessageTone.URGENT,
        messageType: MessageType.IT_SECURITY_ALERT,
        templateVariable: [TemplateVariable.NAME, TemplateVariable.DEPARTMENT],
        count: 2,
        senderDepartment: Department.IT_SECURITY,
      };

      const expectedResponse: GeneratedTemplatesResponseDto = {
        requested: 2,
        generated: 2,
        failed: 0,
        templates: [
          {
            id: 'uuid-1',
            subject: 'Test subject 1',
            body: 'Test body 1',
          },
          {
            id: 'uuid-2',
            subject: 'Test subject 2',
            body: 'Test body 2',
          },
        ],
      };

      mockLlmService.generateTemplates.mockResolvedValue(expectedResponse);

      const result = await controller.difficultyGeneration(requestDto);
      expect(mockLlmService.generateTemplates).toHaveBeenCalledTimes(1);
      expect(mockLlmService.generateTemplates).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle a request with optional senderDepartment not there', async () => {
      const requestDto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.EASY,
        tone: MessageTone.FRIENDLY,
        messageType: MessageType.ANNOUNCEMENT,
        templateVariable: [],
        count: 1,
      };

      const expectedResponse: GeneratedTemplatesResponseDto = {
        requested: 1,
        generated: 1,
        failed: 0,
        templates: [
          {
            id: 'uuid-3',
            subject: 'Test subject 3',
            body: 'Test body 3',
          },
        ],
      };

      mockLlmService.generateTemplates.mockResolvedValue(expectedResponse);

      const result = await controller.difficultyGeneration(requestDto);

      expect(mockLlmService.generateTemplates).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual(expectedResponse);
    });
  });
});
