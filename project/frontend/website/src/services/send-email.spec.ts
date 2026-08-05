import { isErrorResponse, sendEmail, scheduleEmail } from './send-email';
import { SendEmailResponse, ErrorResponse } from '../types';
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

describe('isErrorResponse', () => {
    it('should return true for valid error response', () => {
        const errorResponse: ErrorResponse = { message: 'An error occurred' };
        expect(isErrorResponse(errorResponse)).toBe(true);
    });
    it('should return false for non-error response', () => {
        const nonErrorResponse: SendEmailResponse = { success: true };
        expect(isErrorResponse(nonErrorResponse)).toBe(false);
    });
    it('should return false for null', () => {
        expect(isErrorResponse(null)).toBe(false);
    });
    it('should return false for non-object', () => {
        expect(isErrorResponse('Not an object')).toBe(false);
    });
    it('should return false for object without message property', () => {
        const invalidErrorResponse = { error: 'Missing message' };
        expect(isErrorResponse(invalidErrorResponse)).toBe(false);
    });
    it('should return false for object with non-string message property', () => {
        const invalidErrorResponse = { message: 12345 };
        expect(isErrorResponse(invalidErrorResponse)).toBe(false);
    });
});

describe('sendEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    }
    );

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should send an email and return response', async () => {
        const backendResponse: SendEmailResponse ={
            success: true,
            message: 'Email sent successfully',
        };

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await sendEmail(
            'PHISH-123',
            'recipient@example.com',
        );

        expect(result).toEqual(backendResponse);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/emails/PHISH-123/send-single`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
                body: JSON.stringify({
                    recipient: 'recipient@example.com',
                }),
            },
        );
    });

    it('should not include an authorisation header when there is no token', async () => {
        const backendResponse: SendEmailResponse ={
            success: true,
        };

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        await sendEmail(
            'PHISH-123',
            'recipient@example.com',
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

    it('should throw beckend error if the sending fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'Email referennce was not found',
        }));

        await expect(
            sendEmail('INVALID', 'recipient@example.com'),
        ).rejects.toThrow('Email referennce was not found');
    });

    it('should throw fallback error if backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown error',
        }));

        await expect(
            sendEmail('PHISH-123', 'recipient@example.com'),
        ).rejects.toThrow('Failed to send email');
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
            sendEmail('PHISH-123', 'recipient@example.com'),
        ).rejects.toThrow('Failed to send email');
    });
});

describe('scheduleEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.stubGlobal('fetch', mockFetch);
    }
    );

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should schedule an email and return response', async () => {
        const backendResponse: SendEmailResponse ={
            success: true,
            message: 'Email scheduled successfully',
        };

        localStorage.setItem('access_token', 'test-token');

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        const result = await scheduleEmail(
            'PHISH-567',
            'recipient@example.com',
            '2026-10-20T10:30:00.000Z',
        );

        expect(result).toEqual(backendResponse);

        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE}/emails/PHISH-567/schedule-send-single`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
                body: JSON.stringify({
                    recipient: 'recipient@example.com',
                    scheduledAt: '2026-10-20T10:30:00.000Z',
                }),
            },
        );
    });

    it('should not include an authorisation header when there is no token', async () => {
        const backendResponse: SendEmailResponse ={
            success: true,
        };

        mockFetch.mockResolvedValue(createMockResponse(true, backendResponse));

        await scheduleEmail(
            'PHISH-567',
            'recipient@example.com',
            '2026-10-20T10:30:00.000Z',
        );

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                }
            }),
        );
    });

    it('should throw beckend error if the scheduling fails', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            message: 'The scheduled date must be in the future',
        }));

        await expect(
            scheduleEmail(
                'PHISH-567',
                'recipient@example.com',
                '2020-01-01T10:30:00.000Z',
            ),
        ).rejects.toThrow('The scheduled date must be in the future');
    });

    it('should throw fallback error if backend response has no valid message', async () => {
        mockFetch.mockResolvedValue(createMockResponse(false, {
            error: 'Unknown scheduling error',
        }));

        await expect(
            scheduleEmail(
                'PHISH-567', 
                'recipient@example.com',
                '2026-10-20T10:30:00.000Z',
            ),
        ).rejects.toThrow('Failed to schedule single email');
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
            scheduleEmail(
                'PHISH-567', 
                'recipient@example.com',
                '2026-10-20T10:30:00.000Z',
            ),
        ).rejects.toThrow('Failed to schedule single email');
    });
});