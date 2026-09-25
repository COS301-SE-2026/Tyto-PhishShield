import { API_BASE } from './api';
import { isErrorResponse } from './send-email';

const BATCH_EMAIL_BASE = API_BASE + '/batch-emails';

export interface BatchEmailResponse{
    success: boolean;
    message: string;
    date?:string;
}

export type EmailDifficulty = 'easy' | 'medium' | 'hard';

export interface SenderOptions {
  senderCustomName?: string;
  senderAuth0Id?: string;
  alias?: string;
}

interface RandomBatchRequest extends SenderOptions{
  auth0Id: string[];
  difficulty: EmailDifficulty;
  scheduledFrom: string;
  scheduledTo: string;
  randomisedTimes: boolean;
  waveName: string;
}

interface RandomSameBatchRequest extends RandomBatchRequest {
  referenceNumber?: string;
}

interface BatchWithReferenceRequest extends SenderOptions {
  auth0Id: string[];
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

export async function sendBatchWithReference(referenceNumber: string, auth0Ids: string[], senderOptions: SenderOptions = {}): Promise<BatchEmailResponse> {
  const request: BatchWithReferenceRequest = {
    auth0Id: auth0Ids,
    ...senderOptions,
  }

  return postBatchEmail(
    `${encodeURIComponent(referenceNumber)}/send-batch-with-reference`,
    request,
    'Failed to send batch email',
  );
}

export async function sendBatchRandomSameEmail(
    auth0Ids: string[], 
    difficulty: EmailDifficulty, 
    scheduledFrom: string, 
    scheduledTo: string, 
    randomisedTimes: boolean,
    waveName: string,
    referenceNumber?: string,
    senderOptions: SenderOptions = {},
): Promise<BatchEmailResponse> {
  const request: RandomSameBatchRequest = {
    auth0Id: auth0Ids,
    difficulty,
    scheduledFrom,
    scheduledTo,
    randomisedTimes,
    waveName,
    ...(referenceNumber ? {referenceNumber} : {}),
    ...senderOptions,
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
    waveName: string,
    senderOptions: SenderOptions = {},
): Promise<BatchEmailResponse> {
  const request: RandomBatchRequest = {
    auth0Id: auth0Ids,
    difficulty,
    scheduledFrom,
    scheduledTo,
    randomisedTimes,
    waveName,
    ...senderOptions,
  };

  return postBatchEmail(
    'send-batch-random-different-email',
    request,
    'Failed to send random times different-email batch'
  );
}