export const LINK_INSTRUCTIONS = `The primary objective of this message is to get the recipient to click a single link.

Formatting Requirements:
- Generate ONLY an HTML fragment (do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags).
- Do NOT wrap the output in Markdown code fences (e.g., do not use \`\`\`html).
- Use only minimal formatting: <p> for paragraphs, <br> for line breaks, and <strong>/<em> only where natural.
- Do not use headings, lists, images, tables, inline styles, or <script>/<style> tags.

Link Requirements:
- Include exactly ONE anchor tag.
- The anchor tag MUST literally use href="{{tracking_link}}" (do not URL-encode the braces, do not alter the variable name, and do not replace it with a real URL).
- Replace only "link text" with wording appropriate to the tone and message type (e.g., "Reset Your Password", "Review Document").
- Example structure: <a href="{{tracking_link}}">Reset Your Password</a>
- Include no other links.`;
