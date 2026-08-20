import { API_BASE } from "./api";
import { isErrorResponse } from "./send-email";

const USERS_BASE = API_BASE+ '/accounts/users';

export interface User {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    department: string| null;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export async function getUsers(): Promise<User[]> {
    const token = localStorage.getItem('access_token');

    const response = await fetch(USERS_BASE, {
        method: 'GET',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }, 
    });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(isErrorResponse(data) ? data.message : 'Failed to load users');
  }

  return data as User[];
}