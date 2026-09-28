import { API_BASE, authFetch, parseResponse } from './api';
import { Department } from './llm-template';

const SENDERS_BASE = `${API_BASE}/senders`;

export type RecommendationLevel = 'high' |'medium' | 'low';

export interface SenderRecommendation {
    auth0Id: string;
    email: string;
    department: Department;
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
        params.set('department', department);
    }

    const query = params.toString();
    const url = `${SENDERS_BASE}/recommendations/${encodeURIComponent(recipientAuth0Id)}` + (query ? `?${query}` : '');
    const response = await authFetch(url,{
        method: 'GET'
    });

    return parseResponse<SenderRecommendation[]>(response);
}