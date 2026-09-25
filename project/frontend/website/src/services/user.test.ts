import { describe, beforeEach, afterEach, expect, vi, it } from 'vitest';
import { getUsers, type User } from './user';
import { API_BASE } from './api';

const mockFetch = vi.fn();

function createMockResponse(
    ok: boolean,
    data: unknown,
): Response {
    return {
        ok,
        json: vi.fn().mockResolvedValue(data),
    } as unknown as Response;
}

describe('getUsers', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should get and return all users', async () => {
        const users: User[] =[
            {
                id: 'user-id-1',
                auth0Id: 'auth0|user1',
                email: 'user1@example.com',
                name: 'User',
                department: 'Finance',
                role: 'user',
                isVerified: true,
                isActive: true,
                createdAt: '2026-08-15T10:00:00.000Z',
                updatedAt: '2026-08-16T10:00:00.000Z',
            },
            {
                id: 'user-id-2',
                auth0Id: 'auth0|user2',
                email: 'user2@example.com',
                name: 'User Two',
                department: null,
                role: 'admin',
                isVerified: true,
                isActive: true,
                createdAt: '2026-08-15T10:00:00.000Z',
                updatedAt: '2026-08-16T10:00:00.000Z',
            },
        ];

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, users));

        const result = await getUsers();

        expect(result).toEqual(users);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/accounts/users`,
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer test-token',
                },
            },
        );
    });

    it('should not include an authorisation header if there is no token', async () => {
        mockFetch.mockResolvedValue(createMockResponse(true, []));

        await getUsers();

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/accounts/users`,
            {
                method: 'GET',
                headers: {
                },
            },
        );
    });

    it('should return an empty array if the backend returns no users', async () => {
        mockFetch.mockResolvedValue(createMockResponse(true, []));

        const result = await getUsers();
        expect(result).toEqual([]);
    });

    it('should throw the backend error message if loading users fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'You are not authorised to view users',
        }));

        await expect(getUsers()).rejects.toThrow(
            'You are not authorised to view users',
        );
    });

    it('should trow fallback error when the backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown error',
        }));

        await expect(getUsers()).rejects.toThrow(
            'Failed to load users',
        )
    });

    it('should trow fallback error when the error response in not valid JSON', async () => {
        const response = {
            ok: false,
            json: vi.fn().mockRejectedValue(
                new Error('Invalid JSON'),
            )
        } as unknown as Response
        
        mockFetch.mockResolvedValue(response);

        await expect(getUsers()).rejects.toThrow('Failed to load users');
    });
});
