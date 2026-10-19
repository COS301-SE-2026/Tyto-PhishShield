import { API_BASE, authFetch, parseResponse } from "./api";

const REVIEWS_BASE = `${API_BASE}/reviews`;

export type ReviewType = 
    | 'attachment'
    | 'needs_review'
    | 'both';

export type MistakeCategory = 
    | 'valid_response'
    | 'login_details_leaked'
    | 'secrets_leaked'
    | 'pii_leaked'
    | 'financial_info_leaked'
    | 'needs_review';

export type Severity =
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
    | 'critical';

export type ReviewDecision = 'leak' | 'no_leak';

export interface ReviewAttachment {
    id: string;
    filename: string;
    size: number;
    contentType: string;
    downloadUrl: string;
    expiresAt: string;
}

export interface ReviewUser {
    auth0Id: string;
    email: string;
    name?: string;
    department?: string;
}

export interface ReviewListItem {
    id: string;
    reviewType: ReviewType;
    user: ReviewUser | null;
    subject?: string;
    body?: string;
    attachments: ReviewAttachment[];
    categories?: MistakeCategory[];
    severity?: Severity;
    confidence?: number;
    createdAt: string;
}

export interface ResolveReviewRequest {
    decision:ReviewDecision;
}

export interface ResolvedReview {
    id: string;
    resolved: boolean;
    resolution: ReviewDecision;
    resolvedAt: string;
    [key: string]: unknown;
}

export interface DeleteReviewResponse {
    deleted: boolean;
}

export async function getNeedsReviews(): Promise<ReviewListItem[]> {
    const response = await authFetch(REVIEWS_BASE, {
        method: 'GET'
    });
    return parseResponse<ReviewListItem[]>(response);
}

export async function resolveReview(id:string, decision: ReviewDecision): Promise<ResolvedReview> {
    const request: ResolveReviewRequest= {
        decision,
    };

    const response = await authFetch(
        `${REVIEWS_BASE}/${encodeURIComponent(id)}/resolve`,
        {
            method: 'PATCH',
            body: JSON.stringify(request),
        },
    );

    return parseResponse<ResolvedReview>(response);
}

export async function deleteReview(id:string): Promise<DeleteReviewResponse> {
    const response = await authFetch(
        `${REVIEWS_BASE}/${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
        },
    );

    return parseResponse<DeleteReviewResponse>(response);
}