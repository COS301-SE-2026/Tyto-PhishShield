import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface UserProfileProps {
  onNavigate: (path: string) => void;
  activePath: string;
  userId?: string;
}

const ACHIEVEMENTS = [
  { id: '1', name: 'First Responder', desc: 'Reported 10 phishing emails', earned: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: '2', name: 'Eagle Eye', desc: '0 clicks for 30 days', earned: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { id: '3', name: 'Top Defender', desc: 'Rank #1 in organisation', earned: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id: '4', name: 'Scholar', desc: 'Complete 5 training modules', earned: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
];

const ACTIVITY = [
  { type: 'report', title: 'Reported phishing email: "URGENT: Password expiry notice"', time: '2 hours ago', xp: 50, color: 'var(--color-success)', borderColor: 'var(--color-success-border)', bg: 'var(--color-success-light)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>, iconBg: 'var(--color-success)' },
  { type: 'training', title: 'Completed: Introduction to Social Engineering', time: 'Yesterday', xp: 120, color: 'var(--color-primary)', borderColor: 'var(--color-primary-mid)', bg: 'var(--color-primary-light)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, iconBg: 'var(--color-primary)' },
  { type: 'click', title: 'Clicked simulation: "IT Support Password Reset"', time: '3 days ago', xp: -20, color: 'var(--color-warning)', borderColor: 'var(--color-warning-border)', bg: 'var(--color-warning-light)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>, iconBg: 'var(--color-warning)' },
  { type: 'badge', title: 'Earned badge: Eagle Eye', time: '1 week ago', xp: 0, color: 'var(--text-secondary)', borderColor: 'var(--border)', bg: 'var(--bg-hover)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>, iconBg: 'var(--text-muted)' },
];

const DEPT_STATS = [
  { dept: 'IT & Security', rank: '#2', members: 12, avgXp: 3800 },
  { dept: 'All departments', rank: '#4', members: 87, avgXp: 2100 },
];

export function UserProfile({ onNavigate, activePath, userId }: UserProfileProps) {
  const { user: currentUser, hasRole, canAccess } = useAuth();
  const { addToast } = useToast();
  const isOwnProfile = !userId;
  const isAdmin = hasRole('admin');

  const profileUser = {
    name: isOwnProfile ? (currentUser?.email?.split('@')[0] ?? 'User') : 'Lebo Dlamini',
    email: isOwnProfile ? (currentUser?.email ?? '') : 'lebo@tyto.co.za',
    role: isOwnProfile ? (currentUser?.role ?? 'user') : 'analyst',
    department: 'IT & Security',
    xp: 3560, rank: 4, streak: 12, reportsField: 28,
    initials: isOwnProfile ? (currentUser?.email?.slice(0, 2).toUpperCase() ?? '??') : 'LD',
    accuracy: 88,
  };

  const xpTarget = 5000;
  const xpPct = Math.min((profileUser.xp / xpTarget) * 100, 100);

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title={isOwnProfile ? 'My Profile' : profileUser.name}
      breadcrumbs={isOwnProfile ? undefined : [
        { label: 'Users', path: '/users' },
        { label: profileUser.name },
      ]}
      securityScore={72}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 16, alignItems: 'start' }}>

        {/* Left: profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            {/* Header */}
            <div style={{ background: 'linear-gradient(140deg, #0F172A, #1E3A5F)', padding: '24px 20px 18px', textAlign: 'center' }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 auto 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {profileUser.initials}
              </div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif' }}>{profileUser.name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, marginTop: 2, marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>{profileUser.email}</p>
              <span style={{ background: 'rgba(37,99,235,0.3)', color: '#93C5FD', fontSize: 10, fontWeight: 600, padding: '3px 11px', borderRadius: 9999, border: '1px solid rgba(37,99,235,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)}
              </span>
            </div>

            {/* Stats */}
            <div style={{ padding: '12px 16px' }}>
              {[
                { k: 'XP Points', v: profileUser.xp.toLocaleString() },
                { k: 'Organisation Rank', v: `#${profileUser.rank}` },
                { k: 'Reports Filed', v: String(profileUser.reportsField) },
                { k: 'Current Streak', v: `${profileUser.streak} days` },
                { k: 'Detection Accuracy', v: `${profileUser.accuracy}%` },
                { k: 'Department', v: profileUser.department },
              ].map(s => (
                <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-hover)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.k}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* XP progress */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Level progress</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Silver → Gold</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 20, height: 7 }}>
                <div style={{ background: 'var(--color-primary)', height: 7, borderRadius: 20, width: `${xpPct}%`, transition: 'width 1s ease' }}/>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {profileUser.xp.toLocaleString()} / {xpTarget.toLocaleString()} XP
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin && !isOwnProfile && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <Button fullWidth size="sm" variant="secondary" onClick={() => addToast({ type: 'info', title: 'Edit Role', message: 'Role editor coming soon.' })}>
                  Edit Role
                </Button>
                <Button fullWidth size="sm" variant="ghost" style={{ border: '1px solid var(--border)' }}
                  onClick={() => addToast({ type: 'success', title: 'Reset email sent' })}>
                  Reset Password
                </Button>
                <Button fullWidth size="sm" variant="danger"
                  onClick={() => addToast({ type: 'warning', title: 'User suspended' })}>
                  Suspend User
                </Button>
              </div>
            )}
          </Card>

          {/* Department stats */}
          <Card style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Department Stats</h3>
            {DEPT_STATS.map(d => (
              <div key={d.dept} style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{d.dept}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.rank}</div><div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Rank</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.members}</div><div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Members</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.avgXp.toLocaleString()}</div><div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Avg XP</div></div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right: achievements + activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>Achievements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.id} style={{
                  textAlign: 'center', padding: '14px 10px', borderRadius: 9,
                  background: a.earned ? 'var(--color-primary-light)' : 'var(--bg-hover)',
                  border: `1px solid ${a.earned ? 'var(--color-primary-mid)' : 'var(--border)'}`,
                  opacity: a.earned ? 1 : 0.45,
                  transition: 'transform 0.15s',
                  cursor: a.earned ? 'default' : 'not-allowed',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    background: a.earned ? 'var(--color-primary)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px', color: a.earned ? '#fff' : 'var(--text-muted)',
                  }}>
                    {a.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: a.earned ? 'var(--color-primary)' : 'var(--text-secondary)', marginBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, fontFamily: 'Inter, system-ui, sans-serif' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 13px', borderRadius: 8,
                  background: a.bg, border: `1px solid ${a.borderColor}`,
                }}>
                  <div style={{ width: 28, height: 28, background: a.iconBg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{a.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {a.time}
                      {a.xp !== 0 && (
                        <span style={{ color: a.xp > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, marginLeft: 8 }}>
                          {a.xp > 0 ? '+' : ''}{a.xp} XP
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
