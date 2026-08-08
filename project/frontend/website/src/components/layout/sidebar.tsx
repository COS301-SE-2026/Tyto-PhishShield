import React from 'react';
import { LogoLockup } from '../ui/owl-logo';
import { useAuth } from '../../context/auth-context';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  minRole?: 'admin' | 'analyst' | 'user';
  section?: string;
}

const Icon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>{d2 && <path d={d2}/>}
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  // Main
  { id: 'dashboard',  label: 'Dashboard',   path: '/dashboard',  section: 'MAIN',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'waves',      label: 'Phishing Waves', path: '/waves',     section: 'MAIN', minRole: 'analyst',
    icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
  { id: 'emails',     label: 'Emails',      path: '/emails',     section: 'MAIN', minRole: 'analyst',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg> },
  { id: 'users',      label: 'Users',       path: '/users',      section: 'MAIN', minRole: 'analyst',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'training',   label: 'Training',    path: '/training',   section: 'MAIN',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { id: 'leaderboard',label: 'Leaderboard', path: '/leaderboard', section: 'MAIN',
    icon: <Icon d="M22 12 18 12 15 21 9 3 6 12 2 12"/> },
  // Analytics
  { id: 'analytics',  label: 'Analytics',   path: '/analytics',  minRole: 'analyst', section: 'ANALYTICS',
    icon: <Icon d="M18 20V10" d2="M12 20V4 M6 20v-6"/> },
  { id: 'reports',    label: 'Reports',     path: '/reports',    minRole: 'analyst', section: 'ANALYTICS',
    icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/> },
  // System
  { id: 'settings',   label: 'Settings',    path: '/settings',   section: 'SYSTEM',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

const ROLE_LEVEL: Record<string, number> = { admin: 3, analyst: 2, user: 1 };

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  securityScore?: number;
  collapsed?: boolean;
}

export function Sidebar({ activePath, onNavigate, securityScore = 0, collapsed = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const userLevel = ROLE_LEVEL[user?.role ?? 'user'];
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.minRole) return true;
    return userLevel >= ROLE_LEVEL[item.minRole];
  });
  const sections = ['MAIN', 'ANALYTICS', 'SYSTEM'];
  const scoreColor = securityScore >= 70 ? 'var(--color-success)' : securityScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
  const scoreLabel = securityScore >= 70 ? 'Good' : securityScore >= 40 ? 'Fair' : 'At Risk';
  return (
    <aside style={{
      width: collapsed ? 60 : 218, background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'width 0.2s ease', overflow: 'hidden',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 12px 14px' : '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', flexShrink: 0,
      }} onClick={() => onNavigate('/dashboard')}>
        {collapsed ? (
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" fill="#0F172A" stroke="#2563EB" strokeWidth="1.5"/>
            <ellipse cx="18" cy="21" rx="7" ry="8" fill="#2563EB"/>
            <ellipse cx="18" cy="13" rx="6" ry="5.5" fill="#2563EB"/>
            <ellipse cx="18" cy="13.5" rx="4.5" ry="4" fill="#0F172A"/>
            <circle cx="15.8" cy="13" r="1.8" fill="#fff"/><circle cx="20.2" cy="13" r="1.8" fill="#fff"/>
            <circle cx="15.8" cy="13" r="0.9" fill="#0F172A"/><circle cx="20.2" cy="13" r="0.9" fill="#0F172A"/>
            <path d="M17.2 15.5L18 16.8L18.8 15.5Z" fill="#F59E0B"/>
          </svg>
        ) : (
          <LogoLockup size={28} dark />
        )}
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {sections.map(section => {
          const items = visibleItems.filter(i => i.section === section);
          if (!items.length) return null;
          return (
            <div key={section}>
              {!collapsed && (
                <div style={{
                  fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.22)',
                  letterSpacing: '1px', padding: '0 10px', margin: '10px 0 7px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {section}
                </div>
              )}
              {items.map(item => {
                const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none',
                      background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.7, display: 'flex', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    {!collapsed && item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
      {/* Security score */}
      {!collapsed && (
        <div style={{ padding: '0 10px 16px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9, padding: '11px 13px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Security Score
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, height: 5, marginBottom: 5 }}>
              <div style={{
                background: scoreColor, height: 5, borderRadius: 20,
                width: `${securityScore}%`, transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, system-ui, sans-serif' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{securityScore} / 100</span>
              <span style={{ color: scoreColor, fontSize: 10, fontWeight: 600 }}>{scoreLabel}</span>
            </div>
          </div>
        </div>
      )}
      {/* Logout */}
      <div style={{ padding: '0 10px 14px', flexShrink: 0 }}>
        <button
          onClick={logout}
          title="Sign out"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 9, width: '100%', padding: '8px 11px', borderRadius: 7, border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
