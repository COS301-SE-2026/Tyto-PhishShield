import { useState, useEffect, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { ThemeToggle } from '../ui';
import { useAuth } from '../../context/auth-context';
import { useTheme } from '../../context/theme-context';
import { fetchSecurityScore } from '../../services/security-score';
import { Menu, Bell, ChevronRight, CircleHelp} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export function AppLayout({
  children, activePath, onNavigate, title, subtitle, breadcrumbs, }: AppLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  useEffect(() => {
    if (!user?.auth0Id) return;
    let cancelled = false;
    fetchSecurityScore(user.auth0Id)
      .then(score => { if (!cancelled) setSecurityScore(score); })
      .catch(() => { if (!cancelled) setSecurityScore(0); });
    return () => { cancelled = true; };
  }, [user?.auth0Id]);
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

      {
        useAuth().isAuthenticated ?
        <Sidebar
        activePath={activePath}
        onNavigate={onNavigate}
        securityScore={securityScore}
        collapsed={sidebarCollapsed}
      />
        : ""
      }

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
              <Menu size={18} aria-hidden='true'/>
            </button>
            <div>
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  {breadcrumbs.map((b, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {i > 0 && (
                        <ChevronRight size={18} color='var(--text-muted)' aria-hidden='true'/>
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
              <Bell size={16} aria-hidden='true'/>
              {/* Notification dot */}
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                background: 'var(--color-danger)', borderRadius: '50%',
                border: '1.5px solid var(--bg-topbar)',
              }}/>
            </button>

            <button type="button"
              onClick={() => onNavigate('/help')}
              aria-label="Help Centre"
              title="Help Centre"
              style={{
                background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', position: 'relative',
              }}
            >
              <CircleHelp size={17} aria-hidden='true'/>
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
