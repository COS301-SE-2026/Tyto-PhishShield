export const SANITIZATION_SCHEMA = {
  type: 'object',
  properties: {
    isSafe: {
      type: 'boolean',
      description:
        'true if the text is safe, false if it contains prompt injections or sensitive info',
    },
  },
  required: ['isSafe'],
};
