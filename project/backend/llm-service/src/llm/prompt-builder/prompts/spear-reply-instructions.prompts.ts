export const SPEAR_REPLY_INSTRUCTIONS = `The primary objective of this message is to get the recipient to REPLY to this email, either by writing the requested information in their reply or by replying with a file attached.

Override rule:
- If the message-type description above mentions clicking a link, opening a linked document, or clicking through, ignore that part. This email contains NO links. Ask for a reply instead.

Content Requirements:
- State clearly what you need back (a piece of information or a document that fits the scenario) and ask the recipient to reply to this email with it, or to attach it to their reply.
- Do NOT include any link, URL, anchor tag, or {{tracking_link}} placeholder.
- Do not ask the recipient to call a phone number or visit a website.

Formatting Requirements:
- Generate ONLY an HTML fragment (do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags).
- Do NOT wrap the output in Markdown code fences (e.g., do not use \`\`\`html).
- Use only minimal formatting: <p> for paragraphs, <br> for line breaks, and <strong>/<em> only where natural.
- Do not use headings, lists, images, tables, inline styles, or <script>/<style> tags.

Output:
- Return exactly one email: a subject line and an HTML body fragment. Typically a couple of short paragraphs, except where the message type instructions specify a different length (e.g. a much shorter, terse message), in which case follow those instructions instead.`;