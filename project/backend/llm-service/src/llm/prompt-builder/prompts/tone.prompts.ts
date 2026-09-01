import { MessageTone } from '../../dto/difficulty-llm-generation.dto';

export const TONE_PROMPTS: Record<MessageTone, string> = {
  [MessageTone.PROFESSIONAL]: `Use a formal, businesslike tone. Measured language, no exclamation points, no casual phrasing.`,
  [MessageTone.FRIENDLY]: `Use a warm, approachable tone, as a colleague would use in everyday internal correspondence. Conversational but still workplace-appropriate.`,
  [MessageTone.URGENT]: `Use language that conveys time pressure and the need for immediate action, phrases like "as soon as possible," "before end of day," or a stated deadline. Do not use excessive capitalization or exclamation points; urgency should come from the wording and framing, not from shouting.`,
  [MessageTone.AUTHORITATIVE]: `Write as though from someone with organizational authority (e.g. a senior leader or department head) whose instructions are expected to be followed without much question. Confident, directive language.`,
  [MessageTone.NEUTRAL]: `Use plain, matter-of-fact language with no particular emotional register, neither urgent nor especially warm. Purely informational in feel.`,
  [MessageTone.APOLOGETIC]: `Write as though acknowledging an inconvenience, delay, or mistake, with a somewhat conciliatory tone before making the request.`,
};
