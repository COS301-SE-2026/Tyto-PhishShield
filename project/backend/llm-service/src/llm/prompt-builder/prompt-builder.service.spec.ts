import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';
import {
  Department,
  Difficulty,
  DifficultyLlmGenerationDto,
  MessageTone,
  MessageType,
  TemplateVariable,
} from '../dto/difficulty-llm-generation.dto';
import { DIFFICULTY_PROMPTS } from './prompts/difficulty.prompts';
import { TONE_PROMPTS } from './prompts/tone.prompts';
import { TYPE_PROMPTS } from './prompts/type.prompts';
import { VARIABLE_CONTEXT_PROMPTS } from './prompts/variable-context.prompts';
import { BASE_SYSTEM_INSTRUCTIONS } from './prompts/base-instructions.prompts';
import { LINK_INSTRUCTIONS } from './prompts/link-instructions.prompts';
import { OUTPUT_FORMAT } from './prompts/output-format.prompts';
import { SENDER_DEPARTMENT_PROMPTS } from './prompts/sender-department-prompts';

const BUSINESS_NAME_CONTEXT = `{{business_name}} is the recipient's business/organization name. Use it to make the message feel like it's coming from within their own company (If applicable).`;

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildSystemPrompt', () => {
    it('should build a prompt for EASY difficulty with NO variables', () => {
      const dto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.EASY,
        tone: MessageTone.FRIENDLY,
        messageType: MessageType.ANNOUNCEMENT,
        templateVariable: [],
        count: 1,
      };

      const result = service.buildSystemPrompt(dto);

      expect(result).toContain(BASE_SYSTEM_INSTRUCTIONS);
      expect(result).toContain(DIFFICULTY_PROMPTS[Difficulty.EASY]);
      expect(result).toContain(TONE_PROMPTS[MessageTone.FRIENDLY]);
      expect(result).toContain(TYPE_PROMPTS[MessageType.ANNOUNCEMENT]);
      expect(result).toContain(LINK_INSTRUCTIONS);
      expect(result).toContain(OUTPUT_FORMAT);
      expect(result).toContain(
        'Do not include any personalization placeholders',
      );
      expect(result).not.toContain(BUSINESS_NAME_CONTEXT);
    });

    it('should include BUSINESS_NAME_CONTEXT for MEDIUM difficulty even if no other variables are requested', () => {
      const dto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.MEDIUM,
        tone: MessageTone.PROFESSIONAL,
        messageType: MessageType.DOCUMENT_REQUEST,
        templateVariable: [],
        count: 1,
      };

      const result = service.buildSystemPrompt(dto);

      expect(result).toContain(DIFFICULTY_PROMPTS[Difficulty.MEDIUM]);
      expect(result).toContain(BUSINESS_NAME_CONTEXT);
      expect(result).not.toContain(
        'Do not include any personalization placeholders',
      );
    });

    it('should correctly map and include requested variables and their contexts', () => {
      const dto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.MEDIUM,
        tone: MessageTone.NEUTRAL,
        messageType: MessageType.QUESTION,
        templateVariable: [TemplateVariable.NAME, TemplateVariable.DEPARTMENT],
        count: 1,
      };

      const result = service.buildSystemPrompt(dto);

      expect(result).toContain('{{name}}');
      expect(result).toContain('{{department}}');
      expect(result).toContain(VARIABLE_CONTEXT_PROMPTS[TemplateVariable.NAME]);
      expect(result).toContain(
        VARIABLE_CONTEXT_PROMPTS[TemplateVariable.DEPARTMENT],
      );
    });

    it('should include the sender department section when senderDepartment is provided', () => {
      const dto: DifficultyLlmGenerationDto = {
        difficulty: Difficulty.HARD,
        tone: MessageTone.AUTHORITATIVE,
        messageType: MessageType.IT_SECURITY_ALERT,
        templateVariable: [],
        count: 1,
        senderDepartment: Department.IT_SECURITY,
      };

      const result = service.buildSystemPrompt(dto);

      expect(result).toContain(
        SENDER_DEPARTMENT_PROMPTS[Department.IT_SECURITY],
      );
    });
  });
});
