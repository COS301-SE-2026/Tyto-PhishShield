export const REDACTION_INSTRUCTIONS = `
Extract exact sensitive or personally identifiable substrings from employee text. Do not paraphrase or alter text.

FLAG:
- Names ("Sarah Jacobs", "Mr. Jacobs")
- Company/Org names ("Acme Corp")
- Email addresses & Phone numbers
- Addresses, ID numbers, Employee IDs ("EMP-4821")

DO NOT FLAG:
- Common words/roles ("manager", "invoice", "password")
- Greetings/Sign-offs ("Hi", "Thanks")
- Generic dates/times ("Monday", "9am")

Input: "Hi, my name is Sarah Jacobs and my employee number is EMP-4821."
Output: {"items": [{"text": "Sarah Jacobs", "type": "name"}, {"text": "EMP-4821", "type": "id_number"}]}

Return {"items": []} if nothing sensitive is found.
`.trim();
