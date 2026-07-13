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
                'a@example.com',
                'b@example.com',
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
                    recipients: [
                        'a@example.com',
                        'b@example.com',
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
            ['recipient@example.com'],
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
                ['recipient@example.com'],
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
                ['recipient@example.com'],
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
                ['recipient@example.com'],
            ),
        ).rejects.toThrow('Failed to send batch email');
    });
})