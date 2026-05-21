import { isErrorResponse } from './send-email';
import { SendEmailResponse, ErrorResponse } from '../types';

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