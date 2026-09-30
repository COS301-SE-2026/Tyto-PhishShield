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
import { CLASSIFICATION_INSTRUCTIONS } from './prompts/classification.prompts';
import { CLASSIFICATION_SCHEMA } from './prompts/classification_schema.prompts';
import { REDACTION_INSTRUCTIONS } from './prompts/redaction-instructions.prompts';
import { REDACTION_SCHEMA } from './prompts/redaction-schema.prompts';
import { REPLY_GENERATION_INSTRUCTIONS } from './prompts/reply-generation-instructions.prompts';
import { REPLY_SCHEMA } from './prompts/reply-schema.prompts';
import { buildSpearVariableInstructions } from './prompts/spear-variable-instructions.prompts';
import { SPEAR_REPLY_INSTRUCTIONS } from './prompts/spear-reply-instructions.prompts';
import { GenerateSpearPhishingDto } from '../dto/generate-spear-phishing.dto';
import { SPEAR_TYPE_PROMPTS } from './prompts/spear-type.prompts';
import { SPEAR_SUBTLE_INSTRUCTIONS } from './prompts/spear-subtle-instructions.prompts';
import { SPEAR_MANAGER_INSTRUCTIONS } from './prompts/spear-manager-instructions.prompts';
import { buildStruggleCategoryInstructions } from './prompts/struggle-category-instructions.promts';

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

  buildClassificationPrompt(): string {
    return `
      ${CLASSIFICATION_INSTRUCTIONS}
 
      You MUST respond with ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text.
      Ensure the JSON structure exactly matches this schema:
      ${JSON.stringify(CLASSIFICATION_SCHEMA)}
    `.trim();
  }

  private buildVariableSection(
    variables: TemplateVariable[],
    difficulty: Difficulty,
  ): string {
    if (difficulty === Difficulty.EASY) {
      return 'Do not include any personalization placeholders. Write the message generically. Only the {{tracking_link}} must appear in the message.';
    }

    const placeholders = variables.map((v) => `{{${v}}}`);
    const contextLines = variables.map((v) => VARIABLE_CONTEXT_PROMPTS[v]);

    placeholders.push('{{business_name}}');
    contextLines.push(BUSINESS_NAME_CONTEXT);

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

  buildRedactionPrompt(): string {
    return `
    ${REDACTION_INSTRUCTIONS}

    You MUST respond with ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text.
    Ensure the JSON structure exactly matches this schema:
    ${JSON.stringify(REDACTION_SCHEMA)}
  `.trim();
  }

  buildReplyGenerationPrompt(): string {
    return `
    ${REPLY_GENERATION_INSTRUCTIONS}

    You MUST respond with ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text.
    Ensure the JSON structure exactly matches this schema:
    ${JSON.stringify(REPLY_SCHEMA)}
  `.trim();
  }

  buildSpearPhishingPrompt(
    dto: GenerateSpearPhishingDto,
    safeContext?: string,
  ): string {
    const promptParts = [
      BASE_SYSTEM_INSTRUCTIONS,
      SPEAR_TYPE_PROMPTS[dto.messageType],
      this.buildSenderDepartmentSection(dto.senderDepartment),
      `The target recipient works in the ${dto.recipientDepartment} department. Tailor the psychological lure specifically to their department's likely duties and stressors.`,
      buildSpearVariableInstructions(dto.availableVariables, {
        isManager: dto.isManager,
        frequentContact: dto.frequentContact,
      }),
    ];

    if (safeContext) {
      promptParts.push(
        `Background context, for your own understanding only, do not quote, paraphrase, or reference this description directly in the email; use it only to decide what to ask for and how casually to ask it: "${safeContext}"`,
      );
    }

    if (dto.strugglesCategory) {
      promptParts.push(
        buildStruggleCategoryInstructions(dto.strugglesCategory),
      );
    }

    promptParts.push(SPEAR_SUBTLE_INSTRUCTIONS);

    if (dto.isManager) {
      promptParts.push(SPEAR_MANAGER_INSTRUCTIONS);
    }
    promptParts.push(
      this.buildFamiliaritySection(dto.frequentContact, dto.isManager),
    );

    promptParts.push(SPEAR_REPLY_INSTRUCTIONS);

    return promptParts.filter(Boolean).join('\n\n');
  }

  private buildFamiliaritySection(
    frequentContact?: boolean,
    isManager?: boolean,
  ): string | null {
    if (!frequentContact) return null;

    return isManager
      ? `Familiarity note: this manager and report communicate regularly and directly, not just through formal channels. Write it the way a manager emails someone they talk to often, brief, low ceremony, no need to re-establish context or explain the ask at length.`
      : `Sender/recipient relationship: these two have an established pattern of regular direct communication. Write with that familiarity, shorter sentences, less throat-clearing, no need to re-establish who the sender is or why they'd be asking. Still professional, not casual, but closer to how a manager writes to someone on their own team than to a stranger.`;
  }
}
