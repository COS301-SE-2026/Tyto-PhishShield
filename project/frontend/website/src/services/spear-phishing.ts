import { API_BASE, authFetch, parseResponse } from './api';
import { Department, MessageType } from './llm-template';

const SPEAR_PHISHING_BASE = `${API_BASE}/llm/spear_phishing`;

export interface GenerateSpearPhishingRequest {
    recipientAuth0Id: string;
    senderAuth0Id:string;
    recipientDepartment: Department;
    senderDepartment: Department;
    messageType: MessageType;
    extraContext?: string;
    scheduledFrom?: string;
    scheduledTo?: string;
    isManager?: boolean;
    frequentContact?: boolean;
}

export interface GenerateSpearPhishingResponse {
    accepted: true;
}

export async function generateSpearPhishing(request:GenerateSpearPhishingRequest): Promise<GenerateSpearPhishingResponse> {
    const response = await authFetch(SPEAR_PHISHING_BASE, {
        method: 'POST',
        body: JSON.stringify(request),
    });
    return parseResponse<GenerateSpearPhishingResponse>(response);
}