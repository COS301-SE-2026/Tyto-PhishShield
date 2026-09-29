export interface AvailableVariables {
  sender: string[];
  recipient: string[];
}

export interface RelationshipContext {
  isManager?: boolean;
  frequentContact?: boolean;
}

const ALL_KEYS = ['name', 'surname', 'job_title', 'title'];

export function buildSpearVariableInstructions(
  available?: AvailableVariables,
  relationship: RelationshipContext = {},
): string {
  const senderKeys = available?.sender ?? ALL_KEYS;
  const recipientKeys = available?.recipient ?? ALL_KEYS;

  const has = (keys: string[], key: string) => keys.includes(key);

  const recipientLines: string[] = [];
  if (has(recipientKeys, 'name')) {
    recipientLines.push(
      `- {{name_recipient}}: The recipient's first name. Follow the greeting rule below for whether this or a formal title/surname greeting is used.`,
    );
  }
  if (has(recipientKeys, 'surname')) {
    recipientLines.push(
      `- {{surname_recipient}}: The recipient's last name. Follow the greeting rule below for when to use it; always paired with {{title_recipient}} when both are used.`,
    );
  }
  if (has(recipientKeys, 'title')) {
    recipientLines.push(
      `- {{title_recipient}}: The recipient's personal title (e.g. "Mr", "Mrs", "Dr"). Only ever used directly before {{surname_recipient}}, never alone.`,
    );
  }
  recipientLines.push(
    `- {{department_recipient}}: The recipient's department. Let it shape the overall angle and premise of the request even when the placeholder word itself doesn't appear on the page, insert the literal placeholder sparingly, only where it reads naturally, not in every sentence.`,
  );
  if (has(recipientKeys, 'job_title')) {
    recipientLines.push(
      `- {{job_title_recipient}}: The recipient's job title. Use in the body to tailor the request to their actual responsibilities. Not a form of address.`,
    );
  }

  const senderLines: string[] = [];
  if (has(senderKeys, 'name')) {
    senderLines.push(
      `- {{name_sender}}: The sender's first name. Used in the sign-off${has(senderKeys, 'surname') ? ', together with {{surname_sender}}' : ''}.`,
    );
  }
  if (has(senderKeys, 'surname')) {
    senderLines.push(
      `- {{surname_sender}}: The sender's last name. Used in the sign-off${has(senderKeys, 'name') ? ', together with {{name_sender}}' : ''}.`,
    );
  }
  senderLines.push(
    `- {{department_sender}}: The sender's department. Same principle as {{department_recipient}}, it should shape why this request makes sense coming from this sender, but the placeholder itself should appear sparingly, only where it fits naturally.`,
  );
  if (has(senderKeys, 'job_title')) {
    senderLines.push(
      `- {{job_title_sender}}: The sender's job title. A body detail that lends the request legitimacy, not a sign-off line. A colleague emailing someone they already have a working relationship with doesn't sign off with a title block; that formality undercuts the familiarity the rest of the email is relying on.`,
    );
  }

  const greetingLine = buildGreetingInstruction(recipientKeys, relationship);
  const signoffLine = buildSignoffInstruction(senderKeys);

  return `
You are generating a highly targeted spear-phishing email. You MUST use the following specific placeholders to personalize the message for both the sender and the recipient. Do NOT use generic placeholders like {{name}}. You MUST append the exact suffixes _sender or _recipient, and only use placeholders listed below; do not invent or use any placeholder that isn't listed. Not all place holders need to be used, only when it fits well with the overall structure and context of the email.

Before writing, think through how the sender would actually phrase this specific request to this specific recipient, given their departments and roles, then write that email. Match the same natural, professional wording quality as any other email in this system. The placeholders personalize a genuinely well-written email; they are not slots to fill in mechanically.

Recipient Variables:
${recipientLines.join('\n')}

Sender Variables:
${senderLines.join('\n')}

Shared Variables:
- {{business_name}}: The organization's name. Use in the body where it grounds the scenario (e.g. "the {{business_name}} network", "our {{business_name}} accounts"), and always in the sign-off per the rule below.

Greeting:
${greetingLine}

Sign-off:
${signoffLine}

Rules:
1. Make the email appear as an internal communication from the sender's department to the recipient's department.
2. Weave every placeholder naturally into the text, it should read as an ordinary detail in a real email, never as a filled-in slot.
3. Do not invent specific business processes, named forms, internal systems, or procedural steps beyond what the message type and any provided context actually imply. You don't know exactly how this business operates, keep details as generic as the context supports (e.g. "the document", "this request") rather than fabricating specifics like named forms or systems. Only get concrete where the message type or provided context already gives you something concrete to work with.
`.trim();
}

function buildGreetingInstruction(
  recipientKeys: string[],
  relationship: RelationshipContext,
): string {
  const hasTitle = recipientKeys.includes('title');
  const hasSurname = recipientKeys.includes('surname');
  const hasName = recipientKeys.includes('name');
  const preferCasual = relationship.frequentContact && !relationship.isManager;

  if (preferCasual && hasName) {
    return `- This sender and recipient have an established, frequent working relationship, and the sender is not the recipient's manager, use "Hi {{name_recipient}}," rather than a formal title/surname greeting. First-name address fits how these two would actually address each other.`;
  }

  if (hasTitle && hasSurname) {
    return `- Use "Dear {{title_recipient}} {{surname_recipient}},", correct for a manager-to-report email, or for any recipient the sender doesn't have an established frequent working relationship with.`;
  }
  if (hasName) {
    return `- Use "Hi {{name_recipient}},", a full formal title/surname greeting isn't available for this recipient, so first-name address is the natural fallback rather than an artificially formal one.`;
  }
  return `- No name or title is available for this recipient. Use a generic greeting such as "Hello,".`;
}

function buildSignoffInstruction(senderKeys: string[]): string {
  const hasName = senderKeys.includes('name');
  const hasSurname = senderKeys.includes('surname');

  if (hasName && hasSurname) {
    return `- {{name_sender}} {{surname_sender}}, with {{business_name}} on the line below. Nothing else, no job title, no department, no title block. That's the whole sign-off.`;
  }
  if (hasName) {
    return `- {{name_sender}} alone, with {{business_name}} on the line below. Nothing else.`;
  }
  return `- No sender name is available. Sign off with "Regards," followed by {{business_name}} on the next line, with no personal name.`;
}
