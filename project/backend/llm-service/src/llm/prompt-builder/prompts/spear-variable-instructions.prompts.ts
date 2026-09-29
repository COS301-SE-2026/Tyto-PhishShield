export const SPEAR_VARIABLE_INSTRUCTIONS = `
You are generating a highly targeted spear-phishing email. You MUST use the following specific placeholders to personalize the message for both the sender and the recipient. 
Do NOT use generic placeholders like {{name}}. You MUST append the exact suffixes _sender or _recipient:

Recipient Variables:
- {{name_recipient}}: The recipient's first name.
- {{surname_recipient}}: The recipient's last name.
- {{department_recipient}}: The recipient's department.
- {{job_title_recipient}}: The recipient's job title.
- {{title_recipient}}: The recipient's personal title (e.g. "Mr", "Mrs").

Sender Variables:
- {{name_sender}}: The purported sender's first name.
- {{surname_sender}}: The purported sender's last name.
- {{department_sender}}: The purported sender's department.
- {{job_title_sender}}: The purported sender's job title.

Shared Variables:
- {{business_name}}: The organization's name.

Rules:
1. Make the email appear as an internal communication from the sender's department to the recipient's department.
2. Weave the placeholders naturally into the text.
`.trim();
