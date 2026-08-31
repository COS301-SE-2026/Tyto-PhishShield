import { API_BASE, authFetch } from "./api";
import { isErrorResponse } from "./send-email";

const WAVE_BASE = `${API_BASE}/wave`;

export interface WaveRecipient {
    auth0Id: string;
    referenceNumber: string;
    emailId: string;
    scheduledAt: string;
}

export interface Wave {
    id: string;
    waveName: string;
    scheduledFrom: string;
    scheduledTo: string;
    sameEmail: boolean;
    randomisedTimes: boolean;
    recipients: WaveRecipient[];
}

export interface WaveMinimum {
    waveName: string;
    scheduledFrom: string;
    scheduledTo: string;
    sameEmail: boolean;
    randomisedTimes: boolean;
    numberOfRecipients: number;
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok){
        throw new Error(isErrorResponse(data) ? data.message : fallbackMessage);
    }

    return data as T;
}

export async function getWaveNames(): Promise<string[]> {
    const response = await authFetch(
        `${WAVE_BASE}/names`,
        {
            method: 'GET',
        },
    );

    return readResponse<string[]>(response, 'Failed to retrieve wave names');
}

export async function getWavesMinimum(): Promise<WaveMinimum[]> {
    const response = await authFetch(
        `${WAVE_BASE}/minimum`,
        {
            method: 'GET',
        },
    );

    return readResponse<WaveMinimum[]>(response, 'Failed to retrieve waves');
}

export async function getWaves(): Promise<Wave[]> {
    const response = await authFetch(
        WAVE_BASE,
        {
            method: 'GET',
        },
    );

    return readResponse<Wave[]>(response, 'Failed to retrieve waves');
}

export async function getWave(id: string): Promise<Wave> {
    const response = await authFetch(
        `${WAVE_BASE}/${encodeURIComponent(id)}`,
        {
            method: 'GET',
        },
    );

    return readResponse<Wave>(response, 'Failed to retrieve wave');
}

export async function getWavesForUser(auth0Id: string): Promise<Wave[]> {
    const response = await authFetch(
        `${WAVE_BASE}/user/${encodeURIComponent(auth0Id)}`,
        {
            method: 'GET',
        },
    );

    return readResponse<Wave[]>(response, 'Failed to retrieve waves for the user');
}

export async function deleteWave(id: string): Promise<void> { //no readResponse() since in backend no JSON body is provided on successful delete
    const response = await authFetch(
        `${WAVE_BASE}/${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
        },
    );

    if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);

        throw new Error(isErrorResponse(data) ? data.message: 'Failed to delete wave');
    }
}