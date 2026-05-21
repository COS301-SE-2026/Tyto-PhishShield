import { API_BASE, parseResponse, getToken } from './api';
import { XPResponse } from '../types/index';

const REPORT_BASE: string = API_BASE + '/report';

export const LoadXPController = {
    async getUserXp(): Promise<XPResponse> {
        const response: Response = await fetch(`${REPORT_BASE}/xp`, {
            headers: { 'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`, },
        });
        try {
            const xp = await parseResponse<XPResponse>(response);
            xp.status = "Success";
            return xp;
        } catch (error) {
            const err: Error = error as Error;
            return {
                xp: 0,
                userId: '',
                message: err.message,
                status: "Error",
            }
        }
    }
};