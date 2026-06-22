import { SendEmailResponse, ErrorResponse } from '../types';
import { API_BASE } from './api';

const EMAIL_BASE = API_BASE + '/emails';

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

export async function sendEmail(referenceNumber: string, recipient = 'FiveGuys301@outlook.com'): Promise<SendEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${EMAIL_BASE}/${referenceNumber}/send-single`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        recipient,
      })
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : 'Failed to send email');
  }

  return data as SendEmailResponse;
}
