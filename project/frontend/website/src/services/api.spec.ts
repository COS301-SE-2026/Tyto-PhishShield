import { parseResponse, tokenStore } from './api';

describe('parseResponse', () => {
    it('should parse JSON response correctly', async () => {
        const mockResponse = new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
        interface Message { message: string };
        const result: Message = await parseResponse<Message>(mockResponse);
        expect(result).toEqual({ message: 'Success' });
    });
    it('should throw an error for non-OK response', async () => {
        const mockResponse = new Response(JSON.stringify({ message: 'Error occurred' }), { status: 400 });
        await expect(parseResponse(mockResponse)).rejects.toThrow('Error occurred');
    });
});

describe('tokenStore', () => {
    beforeEach(() => {
        localStorage.clear();
    }
    );
    it('should return null if no token is stored', () => {
        expect(tokenStore.getToken()).toBeNull();
    });
    it('should return the stored token', () => {
        localStorage.setItem('access_token', 'test-token');
        expect(tokenStore.getToken()).toBe('test-token');
    });
    it('should handle non-string tokens gracefully', () => {
        localStorage.setItem('access_token', JSON.stringify({ token: 'test-token' }));
        expect(tokenStore.getToken()).toBe(JSON.stringify({ token: 'test-token' }));
    });

    it('clearToken should remove the token from localStorage', () => {
        localStorage.setItem('access_token', 'test-token');
        tokenStore.clear();
        expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('setToken should store the token in localStorage', () => {
        tokenStore.save('new-test-token', 3600);
        expect(localStorage.getItem('access_token')).toBe('new-test-token');
    });

    it('isValid should return true for valid token', () => {
        tokenStore.save('valid-token', 3600);
        expect(tokenStore.isValid()).toBe(true);
    });
    it('isValid should return false for expired token', () => {
        tokenStore.save('expired-token', -3600);
        expect(tokenStore.isValid()).toBe(false);
    });
});