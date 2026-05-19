import type {
  LoginDto, RegisterDto, LoginResponse,
  RegisterResponse, AuthenticatedUser,
} from '../types';

const ACCOUNTS_BASE =
  typeof import.meta.env.VITE_ACCOUNTS_URL === 'string'
    ? import.meta.env.VITE_ACCOUNTS_URL
    : 'http://localhost:3002';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
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
    const res = await fetch(`${ACCOUNTS_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return parseResponse<RegisterResponse>(res);
  },

  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await fetch(`${ACCOUNTS_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return parseResponse<LoginResponse>(res);
  },

  getMe: async (): Promise<AuthenticatedUser> => {
    const res = await fetch(`${ACCOUNTS_BASE}/api/auth/me`, {
      headers: authHeaders(),
    });
    return parseResponse<AuthenticatedUser>(res);
  },

  /*POST /api/auth/forgot-password  (Stub for backend endpoint not yet implemented)*/
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${ACCOUNTS_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    // Below to handle 404 during development (endpoint not yet implemented)
    if (res.status === 404) return { message: 'Reset email sent (stub)' };
    return parseResponse<{ message: string }>(res);
  },

  /*POST /api/auth/verify-otp  (Stub for backend endpoint not yet implemented?)*/
  verifyOtp: async (userId: string, otp: string): Promise<{ message: string }> => {
    const res = await fetch(`${ACCOUNTS_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp }),
    });
    if (res.status === 404) return { message: 'OTP verified (stub)' };
    return parseResponse<{ message: string }>(res);
  },
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
