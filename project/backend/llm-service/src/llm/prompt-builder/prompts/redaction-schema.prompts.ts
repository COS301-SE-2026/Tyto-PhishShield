export const REDACTION_SCHEMA = {
  items: [
    {
      text: 'string (exact substring from the input)',
      type: 'name | business_name | email | phone | address | id_number | other',
    },
  ],
};
