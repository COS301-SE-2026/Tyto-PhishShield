import { createContext, useContext, useState, useEffect, useCallback,
  type ReactNode, } from 'react';
import type { AuthenticatedUser, LoginResponse, UserRole } from '../types';
import { authApi } from '../services/api'

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  twoFactoredAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  twoFactorAuth: (email: string, code: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (minRole: UserRole) => boolean;
  refreshUser: () => Promise<void>;
};

interface Token {
  access_token: string;
  tokenExpiry: number;
};

const ROLE_LEVEL: Record<UserRole, number> = { admin: 3, analyst: 2, user: 1 };
const AuthContext = createContext<AuthContextValue | null>(null);

const isTokenExpired = () => {
  const expiry = localStorage.getItem('token_expiry');
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<Token | null>(null);
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

  //Returns boolean value indicating whether OTP will be needed
  const login = async (email: string, password: string): Promise<boolean> => {
    // const response: Response = await fetch(`${BASE_URL}/accounts/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!response.ok) { throw new Error('Invalid email or password.'); }
    const loginResponse: LoginResponse = await authApi.login({email, password});
    if (!loginResponse.requiresOTP) {
      setTwoFactoredAuth(true);
      const { access_token, expires_in } = loginResponse;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_expiry', String(Date.now() + expires_in * 1000));
      const me: AuthenticatedUser = await authApi.getMe();
      setUser(me);
    } else {
      setToken({
        access_token: loginResponse.access_token,
        tokenExpiry: Date.now() + loginResponse.expires_in * 1000,
      });
      setUser(null);
    }
    return loginResponse.requiresOTP ?? false;
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
    let message = '';
    try {
      message = (await authApi.verifyOtp(email, code)).message;
    } catch {
      throw new Error(message);
    }
    setTwoFactoredAuth(true);
    localStorage.setItem('access_token', token?.access_token ?? '');
    localStorage.setItem('token_expiry', String(token?.tokenExpiry));
    // const meResponse: Response = await fetch(`${BASE_URL}/accounts/auth/me`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer  ${localStorage.getItem('access_token')}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    //if (meResponse.ok) {
        const me: AuthenticatedUser = await authApi.getMe();
        setUser(me);
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