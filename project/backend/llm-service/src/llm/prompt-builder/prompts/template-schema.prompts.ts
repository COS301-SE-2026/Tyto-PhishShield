export const TEMPLATE_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string', description: 'The email subject line.' },
    body: {
      type: 'string',
      description:
        'HTML fragment for the email body. Must contain exactly one <a href="{{tracking_link}}">...</a> anchor and minimal formatting only.',
    },
  },
  required: ['subject', 'body'],
  additionalProperties: false,
};
