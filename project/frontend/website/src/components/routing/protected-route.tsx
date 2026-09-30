import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/auth-context';
import { Spinner } from '../ui';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  minRole?: UserRole;
  redirectTo?: string;
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-page)', }}>
      <Spinner size={40} />
    </div>
  );
}

export function ProtectedRoute({ children, minRole, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAccess } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (minRole && !canAccess(minRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}