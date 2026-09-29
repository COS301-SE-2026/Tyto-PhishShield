import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNeedsReviews, resolveReview, deleteReview, type ReviewListItem} from './needs-review';
import { API_BASE, authFetch } from './api';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');

  return {
    ...actual,
    authFetch: vi.fn(),
  };
});

const mockAuthFetch = vi.mocked(authFetch);

beforeEach(() => {
  mockAuthFetch.mockReset();
});

function createMockResponse(ok: boolean, data: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
}

describe('getNeedsReviews', () => {
    it('should retreive pending revies', async () => {
        const reviews: ReviewListItem[] = [{
            id: 'review-001',
            reviewType: 'needs_review',
            user: null,
            attachments: [],
            createdAt: '2026-09-27T12:00:00Z'
        }];

        mockAuthFetch.mockResolvedValue(createMockResponse(true, reviews));
        const result = await getNeedsReviews();

        expect(result).toEqual(reviews);
        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/reviews`,
            {method: 'GET'}
        );
    });
    it('should return an empty array when no reviews exist', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, []));
        const result = await getNeedsReviews();
        expect(result).toEqual([]);
    });
    it('should throw the backend error when retrieving fails', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {
            message: 'Failed to retrieve reviews',
        }));

        await expect(getNeedsReviews()).rejects.toThrow('Failed to retrieve reviews');
    });
});

describe('resolveReview', () => {
    it('should resolve a review as a leak', async () => {
        const response = {
            id: 'review-001',
            resolved: true,
            resolution: 'leak',
            resolvedAt: '2026-09-27T12:00:00Z',
        };

        mockAuthFetch.mockResolvedValue(createMockResponse(true, response));
        const result = await resolveReview('review-001', 'leak');

        expect(result).toEqual(response);
        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/reviews/review-001/resolve`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    decision: 'leak',
                }),
            },
        );
    });
    it('should resolve a review as a no leak', async () => {
        const response = {
            id: 'review-001',
            resolved: true,
            resolution: 'no_leak',
            resolvedAt: '2026-09-27T12:00:00Z',
        }

        mockAuthFetch.mockResolvedValue(createMockResponse(true, response));
        const result = await resolveReview('review-001', 'no_leak');

        expect(result).toEqual(response);
        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/reviews/review-001/resolve`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    decision: 'no_leak',
                }),
            },
        );
    });
});

describe('deleteReview', () => {
    it('should delete a review', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, {deleted: true}));
        const result = await deleteReview('review-001');

        expect(result).toEqual({
            deleted: true,
        });

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/reviews/review-001`,
            {
                method: 'DELETE',
            },
        );
    });
});