import { useState, useEffect, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { ThemeToggle, Card } from '../ui';
import { useAuth } from '../../context/auth-context';
import { useTheme } from '../../context/theme-context';
import { useNotifications } from '../../context/notification-context';
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
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
                    <span key={b.path ?? b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen(v => {
                    const next = !v;
                    if (next) markAllRead();
                    return next;
                  });
                }}
                style={{
                  background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', position: 'relative',
                }}>
                <Bell size={16} aria-hidden='true'/>
                {/* Notification dot */}
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                    background: 'var(--color-danger)', borderRadius: '50%',
                    border: '1.5px solid var(--bg-topbar)',
                  }}/>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                  />
                  <Card style={{
                    position: 'absolute', top: 44, right: 0, width: 320, maxHeight: 420,
                    overflowY: 'auto', zIndex: 1000, padding: 0,
                  }}>
                    <div style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: '32px 16px', textAlign: 'center', fontSize: 12,
                        color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif',
                      }}>
                        You are all caught up.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{new Date(n.timestamp).toLocaleString('en-ZA')}</div>
                        </div>
                      ))
                    )}
                  </Card>
                </>
              )}
            </div>

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
