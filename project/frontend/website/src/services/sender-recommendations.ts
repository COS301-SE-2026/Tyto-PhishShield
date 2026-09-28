import { API_BASE, authFetch, parseResponse } from './api';
import { Department } from './llm-template';

const SENDERS_BASE = `${API_BASE}/senders`;

const MAILING_DEPARTMENTS: Record<Department, string> ={
    'it_&_security': 'IT & Security',
    'finance': 'Finance',
    'human_resources': 'Human Resources',
    'legal_&_compliance': 'Legal & Compliance',
    'operations': 'Operations',
    'executive': 'Executive',
};

export type RecommendationLevel = 'high' |'medium' | 'low';

export interface SenderRecommendation {
    auth0Id: string;
    email: string;
    department: string;
    score: number;
    recommendation: RecommendationLevel;
    reasons: string[];
}

export async function getSenderRecommendations(
    recipientAuth0Id: string,
    department?: Department,
): Promise<SenderRecommendation[]> {
    const params = new URLSearchParams();
    if (department) {
        params.set('department', MAILING_DEPARTMENTS[department]);
    }

    const query = params.toString();
    const url = `${SENDERS_BASE}/recommendations/${encodeURIComponent(recipientAuth0Id)}` + (query ? `?${query}` : '');
    const response = await authFetch(url,{
        method: 'GET'
    });

    return parseResponse<SenderRecommendation[]>(response);
}