import { isErrorResponse } from './send-email';
import type { EmailDifficulty } from './send-batch-email';
import { API_BASE,authFetch } from './api';

const EMAIL_BASE = `${API_BASE}/emails`;

export interface EmailTemplate {
    id: string;
    referenceNumber: string;
    sender: string;
    alias?: string;
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
    createdAt: string;
}

export interface CreateEmailTemplateRequest {
    sender: string;
    alias?: string;
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
}

export interface DeleteEmailTemplateResponse {
    affected?: number;
}

export type UpdateEmailTemplateRequest = Partial<CreateEmailTemplateRequest>;

async function readResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      isErrorResponse(data) ? data.message : fallbackMessage,
    );
  }

  return data as T;
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
    const response = await authFetch(EMAIL_BASE, {
        method: 'GET'
    });

    return readResponse<EmailTemplate[]>(
        response,
        'Failed to retrieve email templates',
    );
}

export async function getEmailTemplate(referenceNumber: string): Promise<EmailTemplate> {
    const response = await authFetch(
        `${EMAIL_BASE}/${encodeURIComponent(referenceNumber)}`,
        {method: 'GET'}
    );

    return readResponse<EmailTemplate>(
        response,
        'Failed to retrieve email template',
    );
}

export async function createEmailTemplate(request: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    const response = await authFetch(EMAIL_BASE,{
        method: 'POST',
        body: JSON.stringify(request),
    });

    return readResponse<EmailTemplate>(
        response,
        'Failed to create email template',
    );
}

export async function updateEmailTemplate(
    referenceNumber: string, 
    request: UpdateEmailTemplateRequest
): Promise<EmailTemplate> {
    const response = await authFetch(
        `${EMAIL_BASE}/${encodeURIComponent(referenceNumber)}`,
        {
            method: 'PATCH',
            body: JSON.stringify(request),
        },
    );

    return readResponse<EmailTemplate>(
        response,
        'Failed to update email template',
    );
}

export async function deleteEmailTemplate(
    referenceNumber: string,
): Promise<DeleteEmailTemplateResponse> {
    const response = await authFetch(
        `${EMAIL_BASE}/${encodeURIComponent(referenceNumber)}`,
        {
            method: 'DELETE',
        },
    );

    return readResponse<DeleteEmailTemplateResponse>(
        response,
        'Failed to delete email template',
    );
}