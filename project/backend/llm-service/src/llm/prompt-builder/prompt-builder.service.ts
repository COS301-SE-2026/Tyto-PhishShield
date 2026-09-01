import { Injectable } from '@nestjs/common';
import { DIFFICULTY_PROMPTS } from './prompts/difficulty.prompts';
import {
  Department,
  Difficulty,
  DifficultyLlmGenerationDto,
  TemplateVariable,
} from '../dto/difficulty-llm-generation.dto';
import { TONE_PROMPTS } from './prompts/tone.prompts';
import { TYPE_PROMPTS } from './prompts/type.prompts';
import { VARIABLE_CONTEXT_PROMPTS } from './prompts/variable-context.prompts';
import { BASE_SYSTEM_INSTRUCTIONS } from './prompts/base-instructions.prompts';
import { LINK_INSTRUCTIONS } from './prompts/link-instructions.prompts';
import { OUTPUT_FORMAT } from './prompts/output-format.prompts';
import { SENDER_DEPARTMENT_PROMPTS } from './prompts/sender-department-prompts';

const BUSINESS_NAME_CONTEXT = `{{business_name}} is the recipient's business/organization name. Use it to make the message feel like it's coming from within their own company (If applicable).`;

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(dto: DifficultyLlmGenerationDto): string {
    const prompt = [
      BASE_SYSTEM_INSTRUCTIONS,
      DIFFICULTY_PROMPTS[dto.difficulty],
      TONE_PROMPTS[dto.tone],
      TYPE_PROMPTS[dto.messageType],
      this.buildSenderDepartmentSection(dto.senderDepartment),
      this.buildVariableSection(dto.templateVariable, dto.difficulty),
      LINK_INSTRUCTIONS,
      OUTPUT_FORMAT,
    ];
    return prompt.join('\n\n');
  }

  private buildVariableSection(
    variables: TemplateVariable[],
    difficulty: Difficulty,
  ): string {
    const includeBusinessName = difficulty !== Difficulty.EASY;

    if (variables.length === 0 && !includeBusinessName) {
      return 'Do not include any personalization placeholders. Write the message generically. Only the {{tracking_link}} must appear in the message.';
    }
    const placeholders = variables.map((v) => `{{${v}}}`);
    const contextLines = variables.map((v) => VARIABLE_CONTEXT_PROMPTS[v]);

    if (includeBusinessName) {
      placeholders.push(BUSINESS_NAME_CONTEXT);
      contextLines.push(BUSINESS_NAME_CONTEXT);
    }

    return [
      `You may use these placeholders word-for-word where natural: ${placeholders.join(', ')}`,
      ...contextLines,
    ].join('\n');
  }

  private buildSenderDepartmentSection(
    senderDepartment?: Department,
  ): string | null {
    if (!senderDepartment) {
      return null;
    }
    return SENDER_DEPARTMENT_PROMPTS[senderDepartment];
  }
}
