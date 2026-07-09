import { API_BASE } from './api';
import { isErrorResponse } from './send-email';

const BATCH_EMAIL_BASE = API_BASE + '/batch-emails';

export interface BatchEmailResponse{
    success: boolean;
    message: string;
    date?:string;
}

export type EmailDifficulty = 'easy' | 'medium' | 'hard';

export async function sendBatchWithReference(referenceNumber: string, recipients: string[],): Promise<BatchEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${BATCH_EMAIL_BASE}/${referenceNumber}/send-batch-with-reference`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        recipients,
      })
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? (data).message : 'Failed to send batch email');
  }

  return data as BatchEmailResponse;
}

export async function sendBatchRandomSameEmail(
    recipients: string[], 
    difficulty: EmailDifficulty, 
    scheduledFrom: string, 
    scheduledTo: string, 
    randomisedTimes: boolean,
): Promise<BatchEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${BATCH_EMAIL_BASE}/send-batch-random-same-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        recipients,
        difficulty,
        scheduledFrom,
        scheduledTo,
        randomisedTimes,
      })
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : 'Failed to send random times same-email batch');
  }

  return data as BatchEmailResponse;
}

export async function sendBatchRandomDifferentEmail(
    recipients: string[], 
    difficulty: EmailDifficulty, 
    scheduledFrom: string, 
    scheduledTo: string, 
    randomisedTimes: boolean,
): Promise<BatchEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${BATCH_EMAIL_BASE}/send-batch-random-different-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        recipients,
        difficulty,
        scheduledFrom,
        scheduledTo,
        randomisedTimes,
      })
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : 'Failed to send random times different-email batch');
  }

  return data as BatchEmailResponse;
}