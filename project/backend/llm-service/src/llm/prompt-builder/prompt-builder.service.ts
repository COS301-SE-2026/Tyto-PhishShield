import { Injectable } from '@nestjs/common';
import { DIFFICULTY_PROMPTS } from './prompts/difficulty.prompts';
import {
  DifficultyLlmGenerationDto,
  TemplateVariable,
} from '../dto/difficulty-llm-generation.dto';
import { TONE_PROMPTS } from './prompts/tone.prompts';
import { TYPE_PROMPTS } from './prompts/type.prompts';
import { VARIABLE_CONTEXT_PROMPTS } from './prompts/variable-context.prompts';
import { BASE_SYSTEM_INSTRUCTIONS } from './prompts/base-instructions.prompts';
import { LINK_INSTRUCTIONS } from './prompts/link-instructions.prompts';
import { OUTPUT_FORMAT } from './prompts/output-format.prompts';

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(dto: DifficultyLlmGenerationDto): string {
    const prompt = [
      BASE_SYSTEM_INSTRUCTIONS,
      DIFFICULTY_PROMPTS[dto.difficulty],
      TONE_PROMPTS[dto.tone],
      TYPE_PROMPTS[dto.messageType],
      this.buildVariableSection(dto.templateVariable),
      LINK_INSTRUCTIONS,
      OUTPUT_FORMAT,
    ];
    return prompt.join('\n\n');
  }

  private buildVariableSection(variables: TemplateVariable[]): string {
    if (variables.length === 0) {
      return 'Do not include any personalization placeholders. Write the message generically. Only the {{tracking_link}} must appear in the message.';
    }
    const placeholders = variables.map((v) => `{{${v}}}`).join(', ');
    const contextLines = variables.map((v) => VARIABLE_CONTEXT_PROMPTS[v]);
    return [
      `You may use these placeholders word-for-word where natural: ${placeholders}`,
      ...contextLines,
    ].join('\n');
  }
}
