interface SendEmailResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

interface ErrorResponse {
  message?: string;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

export async function sendEmail(referenceNumber: string): Promise<SendEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `http://localhost:3001/api/emails/${referenceNumber}/send-single`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : 'Failed to send email');
  }

  return data as SendEmailResponse;
}
