export const SPEAR_TEMPLATE_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string', description: 'The email subject line.' },
    body: {
      type: 'string',
      description:
        'HTML fragment for the email body. Must NOT contain any links or anchor tags. Minimal formatting only.',
    },
  },
  required: ['subject', 'body'],
  additionalProperties: false,
};
