import { API_BASE } from './api';

const LLM_BASE = `${API_BASE}/llm`;

export type Difficulty = 'easy'|'medium'|'hard';

export type MessageTone = 'professional'|'friendly'|'urgent'|'authoritative'|'neutral'|'apologetic';

export type MessageType = 'announcement'|'it_security_alert'|'finance_voucher'|'document_request'|'emergency'|'executive_request'|'meeting_invite'|'it_support'|'question';

export type TemplateVariable = 'name' |'department';

export type Department = 'it_&_security'|'finance'|'human_resources'|'legal_&_compliance'|'operations'|'executive';

export interface GenerateTemplatesRequest {
    difficulty: Difficulty;
    tone: MessageTone;
    messageType: MessageType;
    templateVariable: TemplateVariable[];
    count: number;
    senderDepartment?: Department;
}

export interface GeneratedTemplate {
    id: string;
    subject: string;
    body: string;
}

export interface GenerateTemplatesResponse {
    requested: number;
    generated: number;
    failed: number;
    templates: GeneratedTemplate[];
}

export async function generateTemplates(request: GenerateTemplatesRequest): Promise<GenerateTemplatesResponse> {
    const token = localStorage.getItem('access_token');

    const response = await fetch(
        `${LLM_BASE}/difficulty_generation`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && {
                Authorization: `Bearer ${token}`,
                }),
            },
        body: JSON.stringify(request)
        }
    );

    if (!response.ok) {
        throw new Error('Failed to generate templates');
    }
    return response.json() as Promise<GenerateTemplatesResponse>;
}