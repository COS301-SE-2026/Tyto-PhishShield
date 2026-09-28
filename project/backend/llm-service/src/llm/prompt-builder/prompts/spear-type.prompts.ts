import { MessageType } from '../../dto/difficulty-llm-generation.dto';
import { TYPE_PROMPTS } from './type.prompts';

export const SPEAR_TYPE_PROMPTS: Record<MessageType, string> = {
  ...TYPE_PROMPTS,

  [MessageType.IT_SECURITY_ALERT]: `This simulates a notice from the internal IT/security team, e.g. a required password reset, MFA re-enrollment, or a flagged suspicious login. It should prompt the recipient toward an action (replying to this email with the details needed to sort it out) framed as protecting their account.`,

  [MessageType.DOCUMENT_REQUEST]: `This simulates an administrative request to review, fill in, or sign a document, e.g. an HR form, policy acknowledgment, or benefits paperwork. It should prompt the recipient to reply with the requested details written in their reply, or with the completed document attached.`,

  [MessageType.MEETING_INVITE]: `This simulates a meeting- or calendar-related message, e.g. a scheduling request or a meeting change. It should ask the recipient to reply to confirm or to send back the details that are needed.`,

  [MessageType.DIRECT_REQUEST]: `This simulates an unusually terse, low-effort message with almost no context, e.g. a one-line "please send this over" or "can you action this?" It should NOT read like a normal email: no greeting, no explanation, no justification, no signature. Just one or two short sentences making the ask, which the recipient answers by replying. The brevity itself is the test, this format breaks the pattern of the other, more elaborate message types, so it should stand out as minimal rather than mimic their structure.`,
};
