import { MessageType } from '../../dto/difficulty-llm-generation.dto';

export const TYPE_PROMPTS: Record<MessageType, string> = {
  [MessageType.ANNOUNCEMENT]: `This simulates a general internal company announcement, e.g. a policy change, office update, or company news item. It should read as informational content distributed broadly to staff.`,
  [MessageType.IT_SECURITY_ALERT]: `This simulates a notice from the internal IT/security team, e.g. a required password reset, MFA re-enrollment, or a flagged suspicious login. It should prompt the recipient toward an action (starting with clicking on the link) framed as protecting their account.`,
  [MessageType.FINANCE_VOUCHER]: `This simulates a finance-related request, e.g. approving a voucher, processing an expense reimbursement, or issuing a gift card/incentive. It should read as a routine finance-department task requiring the recipient's input or approval.`,
  [MessageType.DOCUMENT_REQUEST]: `This simulates an administrative request to review, fill in, or sign a document, e.g. an HR form, policy acknowledgment, or benefits paperwork. It should prompt the recipient to open or complete a linked document.`,
  [MessageType.EMERGENCY]: `This simulates an urgent, safety- or business-critical notice, e.g. a building/facilities issue, a system outage affecting work, or a time-sensitive operational matter. It should convey that the situation requires prompt attention regardless of the tone selected.`,
  [MessageType.EXECUTIVE_REQUEST]: `This simulates a request that appears to come from a senior leader (e.g. a director or executive) asking the recipient to handle something on their behalf, e.g. reviewing a document, processing a payment, or responding quickly to a request made while the sender is "unavailable." This scenario specifically tests susceptibility to authority-based social engineering.`,
  [MessageType.MEETING_INVITE]: `This simulates a meeting- or calendar-related message, e.g. a scheduling request, meeting change, or an invite requiring the recipient to click through to confirm or view details.`,
  [MessageType.IT_SUPPORT]: `This simulates a routine IT support/helpdesk interaction, e.g. a ticket update, a required software update, or a system maintenance notice.`,
  [MessageType.QUESTION]: `This simulates a casual, low-pressure internal query from a colleague, e.g. asking for input, a quick favor, or information. Minimal urgency; tests whether recipients let their guard down on seemingly innocuous requests.`,
};
