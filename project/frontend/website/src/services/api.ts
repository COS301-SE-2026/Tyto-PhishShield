import type { LoginDto, RegisterDto, LoginResponse, RegisterResponse, AuthenticatedUser,
} from '../types';

export const API_BASE = (import.meta.env.VITE_API_GATEWAY_URL ?? '') + '/api';

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = { message: text }; }
  if (!res.ok) {
    const msg = (body as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : String(msg));
  }
  return body as T;
}

export const authApi = {
  register: async (dto: RegisterDto): Promise<RegisterResponse> => {
    const res = await fetch(`${API_BASE}/accounts/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Register user failed');
    return parseResponse<RegisterResponse>(res);
  },
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/accounts/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Invalid email or password');
    return parseResponse<LoginResponse>(res);
  },

  getMe: async (): Promise<AuthenticatedUser> => {
    const res = await fetch(`${API_BASE}/accounts/auth/me`, {
      headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`, },
    });
    if (!res.ok) throw new Error('Token verification failed');
    return parseResponse<AuthenticatedUser>(res);
  },

  verifyOtp: async (email: string, code: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/auth/verify-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
       },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error('Incorrect email or code');
    return parseResponse<{ message: string }>(res);
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/auth/resend-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
       },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Unable to send otp');
    return parseResponse<{ message: string }>(res);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.status === 404) return { message: 'Reset email sent (stub)' };
    return parseResponse<{ message: string }>(res);
  },
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const tokenStore = {
  save: (token: string, expiresIn: number) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('token_expiry', String(Date.now() + expiresIn * 1000));
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
  },
  isValid: (): boolean => {
    const expiry = Number(localStorage.getItem('token_expiry') ?? 0);
    return Date.now() < expiry;
  },
  getToken: getToken,
};