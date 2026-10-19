export const ALLOWED_RECEIVED_REPLY_DOMAINS = [
  'outlook.com',
  'example-compnay.xyz',
  'gmaill.co.za',
];

export function isAllowedReceivedReplyDomain(addresses: string[]): boolean {
  return addresses.some((address) => {
    const domain = extractDomain(address);
    return ALLOWED_RECEIVED_REPLY_DOMAINS.includes(domain);
  });
}

function extractDomain(address: string): string {
  const match = address.match(/<([^>]+)>/);
  const email = match ? match[1] : address.trim();
  return email.split('@')[1]?.toLowerCase() ?? '';
}
