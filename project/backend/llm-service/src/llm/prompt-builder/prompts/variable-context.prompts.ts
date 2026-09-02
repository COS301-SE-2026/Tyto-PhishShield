import { TemplateVariable } from '../../dto/difficulty-llm-generation.dto';

export const VARIABLE_CONTEXT_PROMPTS: Record<TemplateVariable, string> = {
  [TemplateVariable.NAME]: `{{name}} is the recipient's first name, use it for direct address, e.g. a greeting.`,
  [TemplateVariable.DEPARTMENT]: `{{department}} is the recipient's department, reference it to make the message feel department-specific.`,
};
