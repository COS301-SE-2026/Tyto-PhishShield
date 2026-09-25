import { SendEmailResponse, ErrorResponse } from '../types';
import { API_BASE, authFetch } from './api';

const EMAIL_BASE = API_BASE + '/emails';

export interface SenderOptions {
  senderCustomName?: string;
  senderAuth0Id?: string;
  alias?: string;
}

export interface SendSingleEmailRequest extends SenderOptions {
  auth0Id: string;
}

export interface ScheduleSingleEmailRequest extends SenderOptions {
  auth0Id: string;
  scheduledAt: string;
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T>{
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : fallbackMessage);
  }

  return data as T;
}

export async function sendEmail(referenceNumber: string, auth0Id: string, senderOptions: SenderOptions = {}): Promise<SendEmailResponse> {
  const body: SendSingleEmailRequest = {
    auth0Id,
    ...senderOptions,
  }

  const response = await authFetch(
    `${EMAIL_BASE}/${referenceNumber}/send-single`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  return readResponse<SendEmailResponse>(
    response,
    'Failed to send email',
  );
}

export async function scheduleEmail(referenceNumber: string, auth0Id: string, scheduledAt: string, senderOptions: SenderOptions = {}): Promise<SendEmailResponse> {
  const body: ScheduleSingleEmailRequest = {
    auth0Id,
    scheduledAt,
    ...senderOptions,
  };

  const response = await authFetch(
    `${EMAIL_BASE}/${referenceNumber}/schedule-send-single`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  return readResponse<SendEmailResponse>(
    response,
    'Failed to schedule single email',
  );
}