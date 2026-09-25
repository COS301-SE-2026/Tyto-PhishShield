import React from 'react';
import { LogoLockup } from '../ui/owl-logo';
import { useAuth } from '../../context/auth-context';
import { LogOut, Settings, FileText, LayoutDashboard, ShieldCheck, Users, BookOpen, Trophy, BarChart3, Mail } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  minRole?: 'admin' | 'analyst' | 'user';
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { id: 'dashboard',  label: 'Dashboard',   path: '/dashboard',  section: 'MAIN',
    icon: <LayoutDashboard size={15} /> },
  { id: 'waves',  label: 'Phishing Waves',   path: '/waves',  section: 'MAIN', minRole: 'analyst',
    icon: <ShieldCheck size={15} /> },
  { id: 'emails', label: 'Emails', path: '/emails', section: 'MAIN', minRole: 'analyst',
    icon: <Mail size={15} /> },
  { id: 'users',      label: 'Users',       path: '/users',      section: 'MAIN', minRole: 'analyst',
    icon: <Users size={15} /> },
  { id: 'training',   label: 'Training',    path: '/training',   section: 'MAIN',
    icon: <BookOpen size={15} /> },
  { id: 'leaderboard',label: 'Leaderboard', path: '/leaderboard', section: 'MAIN',
    icon: <Trophy size={15} /> },
  // Analytics
  { id: 'analytics',  label: 'Analytics',   path: '/analytics',  minRole: 'analyst', section: 'ANALYTICS',
    icon: <BarChart3 size={15} /> },
  { id: 'reports', label: 'Reports', path: '/analytics/reports', minRole: 'analyst', section: 'ANALYTICS',
    icon: <FileText size={15} /> },
  // System
  { id: 'settings',   label: 'Settings',    path: '/settings',   section: 'SYSTEM',
    icon: <Settings size={15} /> },
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
  const activeItem = visibleItems.reduce<NavItem | null>((best, item) => {
    const matches = activePath === item.path || activePath.startsWith(item.path + '/');
    if (!matches) return best;
    if (!best || item.path.length > best.path.length) return item;
  return best;
  }, null);  
  const scoreColor = securityScore >= 70 ? 'var(--color-success)' : securityScore >= 40 ? 'var(--color-warning)' : 'var(--sidebar-danger)';
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
                  fontSize: 9, fontWeight: 600, color: 'var(--sidebar-text)',
                  letterSpacing: '1px', padding: '0 10px', margin: '10px 0 7px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {section}
                </div>
              )}
              {items.map(item => {
                const isActive = item.id === activeItem?.id;
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
            <div style={{ color: 'var(--sidebar-text)', fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Security Score
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, height: 5, marginBottom: 5 }}>
              <div style={{
                background: scoreColor, height: 5, borderRadius: 20,
                width: `${securityScore}%`, transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, system-ui, sans-serif' }}>
              <span style={{ color: 'var(--sidebar-text)', fontSize: 10 }}>{securityScore} / 100</span>
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
            background: 'transparent', color: 'var(--sidebar-text)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text)'}
        >
          <LogOut size={15} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
