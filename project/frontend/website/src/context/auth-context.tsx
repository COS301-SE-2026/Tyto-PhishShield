import { createContext, useContext, useState, useEffect, useCallback,
  type ReactNode, } from 'react';
import type { AuthenticatedUser, LoginResponse, UserRole } from '../types';
import { authApi } from '../services/api'

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  twoFactoredAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  twoFactorAuth: (email: string, code: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (minRole: UserRole) => boolean;
  refreshUser: () => Promise<void>;
}

const ROLE_LEVEL: Record<UserRole, number> = { admin: 3, analyst: 2, user: 1 };
const AuthContext = createContext<AuthContextValue | null>(null);

const isTokenExpired = () => {
  const expiry = localStorage.getItem('token_expiry');
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [twoFactoredAuth, setTwoFactoredAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token || isTokenExpired()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      // const response: Response = await fetch(`${BASE_URL}/accounts/auth/me`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // if (!response.ok) throw new Error('Token verification failed');
      const me: AuthenticatedUser = await authApi.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string) => {
    // const response: Response = await fetch(`${BASE_URL}/accounts/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!response.ok) { throw new Error('Invalid email or password.'); }
    const loginResponse: LoginResponse = await authApi.login({email, password});
    // interface Token {
    //   access_token: string;
    //   expires_in: number;
    // };
    const { access_token, expires_in } = loginResponse;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('token_expiry', String(Date.now() + expires_in * 1000));
    setUser(null);
  };

  const twoFactorAuth = async (email: string, code: string) => {
    // const response: Response = await fetch(`${BASE_URL}/accounts/auth/verify-otp`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    //   }, 
    //   body: JSON.stringify({email, code}),
    // });

    // if (!response.ok) throw new Error('Invalid OTP or email');
    let message: string = '';
    try {
      message = (await authApi.verifyOtp(email, code)).message;
    } catch (err: unknown) {
      throw new Error(message);
    }
    setTwoFactoredAuth(true);
    // const meResponse: Response = await fetch(`${BASE_URL}/accounts/auth/me`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer  ${localStorage.getItem('access_token')}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    //if (meResponse.ok) {
      try {
        const me: AuthenticatedUser = await authApi.getMe();
        setUser(me);
      } catch (err: unknown) {
        throw err;
      }
    //}
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  };

  const canAccess = (minRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, twoFactoredAuth, isAuthenticated: !!user,
      login, twoFactorAuth, logout, hasRole, canAccess, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}