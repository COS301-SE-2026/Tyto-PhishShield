export const SPEAR_REPLY_INSTRUCTIONS = `The primary objective of this message is to get the recipient to REPLY to this email, either by writing the requested information in their reply or by replying with a file attached. This must be the only channel offered.

Override rule:
- If the message-type description above mentions clicking a link, opening a linked document, or clicking through, ignore that part. This email contains NO links. The reply itself is the only way to respond.

Content Requirements:
- State clearly what you need back (a piece of information or a document that fits the scenario), phrased the way a colleague would actually ask for it, e.g. "send that over", "let me have the numbers", "get that back to me", not as an instruction describing the mechanism.
- Do NOT say "reply to this email/message" or describe the act of replying at all. Since no other channel is offered (no link, no phone number, no separate system), a plain request to send something already implies replying to this email, naming that mechanism out loud is what makes it read like an automated message instead of a real one.
- If a document is needed, ask them to attach it when they send it over, phrased naturally (e.g. "just attach it when you send it through"), not as a formal instruction ("reply to this email with it attached").
- Do NOT include any link, URL, anchor tag, or {{tracking_link}} placeholder.
- Do not ask the recipient to call a phone number or visit a website.

Formatting Requirements:
- Generate ONLY an HTML fragment (do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags).
- Do NOT wrap the output in Markdown code fences (e.g., do not use \`\`\`html).
- Use only minimal formatting: <p> for paragraphs, <br> for line breaks, and <strong>/<em> only where natural.
- Do not use headings, lists, images, tables, inline styles, or <script>/<style> tags.

Output:
- Return exactly one email: a subject line and an HTML body fragment. Typically a couple of short paragraphs, except where the message type instructions specify a different length (e.g. a much shorter, terse message), in which case follow those instructions instead.`;
