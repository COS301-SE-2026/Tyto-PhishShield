import { describe, beforeEach, expect, vi, it } from 'vitest';
import { deleteWave, getWave, getWaveNames, getWaves, getWavesMinimum,getWavesForUser, type Wave, type WaveMinimum } from './wave';
import { API_BASE, authFetch } from './api';

vi.mock('./api', () => ({
    API_BASE: '/api',
    authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

function createMockResponse(
    ok: boolean,
    data: unknown,
): Response {
    return {
        ok,
        json: vi.fn().mockResolvedValue(data),
    } as unknown as Response;
}

const testWave: Wave = {
    id: 'id1',
    waveName: 'Test Wave',
    scheduledFrom: '2026-08-20T10:00:00.000Z',
    scheduledTo: '2026-08-20T20:00:00.000Z',
    sameEmail: true,
    randomisedTimes: true,
    recipients: [
        {
            auth0Id: 'auth0|user1',
            referenceNumber: 'PHISH-67',
            emailId: 'resend-email-1',
            scheduledAt: '2026-08-20T10:30:00.000Z',
        },
    ]
}

const testMinimumWave: WaveMinimum = {
    waveName: 'Test Wave',
    scheduledFrom: '2026-08-20T10:00:00.000Z',
    scheduledTo: '2026-08-20T20:00:00.000Z',
    sameEmail: true,
    randomisedTimes: true,
    numberOfRecipients: 1,
}

beforeEach(() => {
    mockAuthFetch.mockReset();
});

describe('getWaveNames', () => {
    it('should retrieve all wave names', async () => {
        const backendResponse =[
            'Finance Wave',
            'HR Wave',
        ];

        mockAuthFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await getWaveNames();

        expect(result).toEqual(backendResponse);

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/names`,
            {
                method: 'GET',
            },
        );
    });

    it('should throw backend error if retrieving wave names fails', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {message: 'Failed to retrieve names'}));

        await expect(getWaveNames()).rejects.toThrow('Failed to retrieve names');
    });

    it('should throw fallback error for an invalid error response', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {error: 'Unknown error'}));

        await expect(getWaveNames()).rejects.toThrow('Failed to retrieve wave names');
    });
});

describe('getWavesMinimum', () => {
    it('should retrieve minimum wave info', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, [testMinimumWave]));

        const result = await getWavesMinimum();

        expect(result).toEqual([testMinimumWave]);

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/minimum`,
            {
                method: 'GET',
            },
        );
    });

    it('should return empty array when no waves exist', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, []));

        const result = await getWavesMinimum();

        expect(result).toEqual([]);
    });

    it('should throw backend error if retrieving waves fails', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {message: 'Database unavailable'}));

        await expect(getWavesMinimum()).rejects.toThrow('Database unavailable');
    });

    it('should throw fallback error when response has no message', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {error: 'Unknown error'}));

        await expect(getWavesMinimum()).rejects.toThrow('Failed to retrieve waves');
    });
});

describe('getWaves', () => {
    it('should retrieve all waves with recipients', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, [testWave]));

        const result = await getWaves();

        expect(result).toEqual([testWave]);

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave`,
            {
                method: 'GET',
            },
        );
    });

    it('should throw backend error if retrieving waves fails', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {message: 'Could not retrieve waves'}));

        await expect(getWaves()).rejects.toThrow('Could not retrieve waves');
    });
});


describe('getWave', () => {
    it('should retrieve wave by id', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, testWave));

        const result = await getWave(testWave.id);

        expect(result).toEqual(testWave);

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/${testWave.id}`,
            {
                method: 'GET',
            },
        );
    });

    it('should encode id in the URL', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, testWave));

        await getWave('wave/id');

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/wave%2Fid`,
            {
                method: 'GET',
            },
        );
    });

    it('should throw backend error if wave is not found', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {message: 'Wave not found'}));

        await expect(getWave('invalid-id')).rejects.toThrow('Wave not found');
    });
});

describe('getWavesForUser', () => {
    it('should retrieve wave for a specific user', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, [testWave]));

        const result = await getWavesForUser('auth0|user1');

        expect(result).toEqual([testWave]);

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/user/auth0%7Cuser1`,
            {
                method: 'GET',
            },
        );
    });

    it('should return an empty array if the user has no waves', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(true, []));

        const result = await getWavesForUser('auth0|user2');

        expect(result).toEqual([]);
    });

    it('should throw backend error if user wave lookup fails', async () => {
        mockAuthFetch.mockResolvedValue(createMockResponse(false, {message: 'User wave lookup failed'}));

        await expect(getWavesForUser('auth0|user1')).rejects.toThrow('User wave lookup failed');
    });
});

describe('deleteWave', () => {
    it('should delete a wave', async () => {
        const response = {
            ok: true,
            status: 204,
        } as Response;

        mockAuthFetch.mockResolvedValue(response);

        await expect(
            deleteWave(testWave.id),
        ).resolves.toBeUndefined();

        expect(mockAuthFetch).toHaveBeenCalledWith(
            `${API_BASE}/wave/${testWave.id}`,
            {
                method: 'DELETE',
            },
        );
    });

    it('should throw backend error when deletion fails', async () => {
        mockAuthFetch.mockResolvedValue(
            createMockResponse(false, {
                message: 'Wave not found',
            }),
        );

        await expect(
            deleteWave('invalid-id'),
        ).rejects.toThrow('Wave not found');
    });

    it('should throw fallback error when backend response has no valid message', async () => {
        mockAuthFetch.mockResolvedValue(
            createMockResponse(false, {
                error: 'Unknown error',
            }),
        );

        await expect(
            deleteWave(testWave.id),
        ).rejects.toThrow(
            'Failed to delete wave',
        );
    });

    it('should throw fallback error if error response is not valid  JSON', async () => {
        const response = {
            ok: false,
            json: vi.fn().mockRejectedValue(
                new Error('Invalid JSON'),
            ),
        } as unknown as Response;

        mockAuthFetch.mockResolvedValue(response);

        await expect(
            deleteWave(testWave.id),
        ).rejects.toThrow(
            'Failed to delete wave',
        );
    });
});
