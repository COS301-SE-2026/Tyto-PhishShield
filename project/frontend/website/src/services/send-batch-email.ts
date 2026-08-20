import { API_BASE } from './api';
import { isErrorResponse } from './send-email';

const BATCH_EMAIL_BASE = API_BASE + '/batch-emails';

export interface BatchEmailResponse{
    success: boolean;
    message: string;
    date?:string;
}

export type EmailDifficulty = 'easy' | 'medium' | 'hard';

interface RandomBatchRequest {
  auth0Id: string[];
  difficulty: EmailDifficulty;
  scheduledFrom: string;
  scheduledTo: string;
  randomisedTimes: boolean;
}

async function postBatchEmail(
  endpoint: string,
  body: object,
  fallbackErrorMessage: string,
): Promise<BatchEmailResponse> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${BATCH_EMAIL_BASE}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : fallbackErrorMessage);
  }

  return data as BatchEmailResponse;
}

export async function sendBatchWithReference(referenceNumber: string, auth0Ids: string[],): Promise<BatchEmailResponse> {
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
        auth0Id: auth0Ids,
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
    auth0Ids: string[], 
    difficulty: EmailDifficulty, 
    scheduledFrom: string, 
    scheduledTo: string, 
    randomisedTimes: boolean,
): Promise<BatchEmailResponse> {
  const request: RandomBatchRequest = {
    auth0Id: auth0Ids,
    difficulty,
    scheduledFrom,
    scheduledTo,
    randomisedTimes
  };

  return postBatchEmail(
    'send-batch-random-same-email',
    request,
    'Failed to send random times same-email batch'
  );
}

export async function sendBatchRandomDifferentEmail(
    auth0Ids: string[], 
    difficulty: EmailDifficulty, 
    scheduledFrom: string, 
    scheduledTo: string, 
    randomisedTimes: boolean,
): Promise<BatchEmailResponse> {
  const request: RandomBatchRequest = {
    auth0Id: auth0Ids,
    difficulty,
    scheduledFrom,
    scheduledTo,
    randomisedTimes
  };

  return postBatchEmail(
    'send-batch-random-different-email',
    request,
    'Failed to send random times different-email batch'
  );
}