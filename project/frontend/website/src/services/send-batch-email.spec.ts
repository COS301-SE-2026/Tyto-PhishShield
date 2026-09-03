import { BatchEmailResponse, sendBatchRandomDifferentEmail, sendBatchRandomSameEmail,sendBatchWithReference } from "./send-batch-email";
import { API_BASE } from "./api";

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

describe('sendBatchWithReference', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should send a batch using a reference number and return a response', async () => {
        const backendResponse: BatchEmailResponse = {
            success: true,
            message: 'Batch email sent successfully',
            date: '2026-07-13T12:00:00.000Z',
        }

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await sendBatchWithReference(
            'PHISH-123',
            [
                'auth0|user1',
                'auth0|user2',
            ],
        );

        expect(result).toEqual(backendResponse);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/batch-emails/PHISH-123/send-batch-with-reference`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
                body: JSON.stringify({
                    auth0Id: [
                        'auth0|user1',
                        'auth0|user2',
                    ],
                }),
            },
        );
    });

    it('should not include an authorisation header when there is no token', async () => {
        const backendResponse: BatchEmailResponse ={
            success: true,
            message: 'Batch email sent successfully',
        };
    
        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));
    
        await sendBatchWithReference(
            'PHISH-123',
            ['auth0|user1'],
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
        );
    });

    it('should throw backend error message when sendingg fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'Email reference was not found'
        }));

        await expect(
            sendBatchWithReference(
                'INVALID',
                ['auth0|user1'],
            ),
        ).rejects.toThrow('Email reference was not found');
    });

    it('should throw fallback error if backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown error',
        }));

        await expect(
            sendBatchWithReference(
                'PHISH-123',
                ['auth0|user1'],
            ),
        ).rejects.toThrow('Failed to send batch email');
    });

    it('should throw fallback error if the error response is not valid JSON', async () => {
        const response = {
            ok: false,
            json: vi.fn().mockRejectedValue(
                new Error('Invalid JSON'),
            ),
        } as unknown as Response;

        mockFetch.mockResolvedValue(response);

        await expect(
            sendBatchWithReference(
                'PHISH-123',
                ['auth0|user1'],
            ),
        ).rejects.toThrow('Failed to send batch email');
    });
});

describe('sendBatchRandomSameEmail', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should send a random same-email batch and return the response', async () => {
        const backendResponse: BatchEmailResponse = {
            success: true,
            message: 'Same-email batch scheduled successfully',
            date: '2026-10-20T10:30:00.000Z',
        }

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await sendBatchRandomSameEmail(
            [
                'auth0|user1',
                'auth0|user2',
            ],
            'medium',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            true,
            'Test Wave',
        );

        expect(result).toEqual(backendResponse);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/batch-emails/send-batch-random-same-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
                body: JSON.stringify({
                    auth0Id: [
                        'auth0|user1',
                        'auth0|user2',
                    ],
                    difficulty: 'medium',
                    scheduledFrom: '2026-10-20T10:00:00.000Z',
                    scheduledTo: '2026-10-20T12:00:00.000Z',
                    randomisedTimes: true,
                    waveName: 'Test Wave',
                }),
            },
        );
    });

    it('should not include an authorisation header when there is no token', async () => {
        const backendResponse: BatchEmailResponse ={
            success: true,
            message: 'Same-email batch scheduled successfully',
        };
    
        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));
    
        await sendBatchRandomSameEmail(
            ['auth0|user1'],
            'easy',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            false,
            'Test Wave',
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
        );
    });

    it('should correctly send false for randomisedTimes', async () => {
        const backendResponse: BatchEmailResponse ={
            success: true,
            message: 'Same-email batch scheduled successfully',
        };

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        await sendBatchRandomSameEmail(
            ['auth0|user1'],
            'hard',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            false,
            'Test Wave',
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    auth0Id: ['auth0|user1'],
                    difficulty: 'hard',
                    scheduledFrom: '2026-10-20T10:00:00.000Z',
                    scheduledTo: '2026-10-20T12:00:00.000Z',
                    randomisedTimes: false,
                    waveName: 'Test Wave',
                })
            }),
        );
    });

    it('should include a reference number for a same email wave when one is provided', async () => {
        const backendResponse: BatchEmailResponse = {
            success: true,
            message: 'Same-email batch scheduled successfully'
        };

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        await sendBatchRandomSameEmail(
            ['auth0|user1'],
            'hard',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            false,
            'Test Wave',
            'PHISH-67',
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    auth0Id: ['auth0|user1'],
                    difficulty: 'hard',
                    scheduledFrom: '2026-10-20T10:00:00.000Z',
                    scheduledTo: '2026-10-20T12:00:00.000Z',
                    randomisedTimes: false,
                    waveName: 'Test Wave',
                    referenceNumber: 'PHISH-67',
                })
            }),
        );
    });

    it('should throw backend error message when sendingg fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'No matching email template was found'
        }));

        await expect(
            sendBatchRandomSameEmail(
                ['auth0|user1'],
                'hard',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('No matching email template was found');
    });

    it('should throw fallback error if backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown error',
        }));

        await expect(
            sendBatchRandomSameEmail(
                ['auth0|user1'],
                'easy',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('Failed to send random times same-email batch');
    });

    it('should throw fallback error if the error response is not valid JSON', async () => {
        const response = {
            ok: false,
            json: vi.fn().mockRejectedValue(
                new Error('Invalid JSON'),
            ),
        } as unknown as Response;

        mockFetch.mockResolvedValue(response);

        await expect(
            sendBatchRandomSameEmail(
                ['auth0|user1'],
                'easy',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('Failed to send random times same-email batch');
    });
});

describe('sendBatchRandomDifferentEmail', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should send a random different-email batch and return the response', async () => {
        const backendResponse: BatchEmailResponse = {
            success: true,
            message: 'Different-email batch scheduled successfully',
            date: '2026-10-20T10:30:00.000Z',
        }

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await sendBatchRandomDifferentEmail(
            [
                'auth0|user1',
                'auth0|user2',
            ],
            'hard',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            true,
            'Test Wave',
        );

        expect(result).toEqual(backendResponse);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/batch-emails/send-batch-random-different-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
                body: JSON.stringify({
                    auth0Id: [
                        'auth0|user1',
                        'auth0|user2',
                    ],
                    difficulty: 'hard',
                    scheduledFrom: '2026-10-20T10:00:00.000Z',
                    scheduledTo: '2026-10-20T12:00:00.000Z',
                    randomisedTimes: true,
                    waveName: 'Test Wave',
                }),
            },
        );
    });

    it('should not include an authorisation header when there is no token', async () => {
        const backendResponse: BatchEmailResponse ={
            success: true,
            message: 'Different-email batch scheduled successfully',
        };
    
        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));
    
        await sendBatchRandomDifferentEmail(
            ['auth0|user1'],
            'medium',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            false,
            'Test Wave',
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
        );
    });

    it('should correctly send false for randomisedTimes', async () => {
        const backendResponse: BatchEmailResponse ={
            success: true,
            message: 'Different-email batch scheduled successfully',
        };

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        await sendBatchRandomDifferentEmail(
            ['auth0|user1'],
            'medium',
            '2026-10-20T10:00:00.000Z',
            '2026-10-20T12:00:00.000Z',
            false,
            'Test Wave',
        );
    
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    auth0Id: ['auth0|user1'],
                    difficulty: 'medium',
                    scheduledFrom: '2026-10-20T10:00:00.000Z',
                    scheduledTo: '2026-10-20T12:00:00.000Z',
                    randomisedTimes: false,
                    waveName: 'Test Wave',
                })
            }),
        );
    });

    it('should throw backend error message when sendingg fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'No matching email template was found'
        }));

        await expect(
            sendBatchRandomDifferentEmail(
                ['auth0|user1'],
                'hard',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('No matching email template was found');
    });

    it('should throw fallback error if backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown error',
        }));

        await expect(
            sendBatchRandomDifferentEmail(
                ['auth0|user1'],
                'easy',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('Failed to send random times different-email batch');
    });

    it('should throw fallback error if the error response is not valid JSON', async () => {
        const response = {
            ok: false,
            json: vi.fn().mockRejectedValue(
                new Error('Invalid JSON'),
            ),
        } as unknown as Response;

        mockFetch.mockResolvedValue(response);

        await expect(
            sendBatchRandomDifferentEmail(
                ['auth0|user1'],
                'easy',
                '2026-10-20T10:00:00.000Z',
                '2026-10-20T12:00:00.000Z',
                false,
                'Test Wave',
            ),
        ).rejects.toThrow('Failed to send random times different-email batch');
    });
});