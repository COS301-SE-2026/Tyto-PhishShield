import { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { ThemeToggle } from '../ui';
import { useAuth } from '../../context/auth-context';
import { useTheme } from '../../context/theme-context';

interface AppLayoutProps {
  children: ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  securityScore?: number;
}

export function AppLayout({
  children, activePath, onNavigate, title, subtitle, breadcrumbs, securityScore = 72, }: AppLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initials = (() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.split('@')[0].slice(0, 2).toUpperCase();
    return '??';
  })();
  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg-page)', }}>
      <Sidebar
        activePath={activePath}
        onNavigate={onNavigate}
        securityScore={securityScore}
        collapsed={sidebarCollapsed}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          background: 'var(--bg-topbar)', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex',
              }}
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  {breadcrumbs.map((b, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {i > 0 && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                      {b.path ? (
                        <button onClick={() => onNavigate(b.path!)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: 13, fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                          fontFamily: 'Inter, system-ui, sans-serif', padding: 0,
                        }}>
                          {b.label}
                        </button>
                      ) : (
                        <span style={{
                          color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: 13, fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                        }}>
                          {b.label}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h1>
                  {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>}
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            <button style={{
              background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', position: 'relative',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* Notification dot */}
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                background: 'var(--color-danger)', borderRadius: '50%',
                border: '1.5px solid var(--bg-topbar)',
              }}/>
            </button>

            <button
              onClick={() => onNavigate('/users/profile')}
              style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 26px', background: 'var(--bg-page)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
