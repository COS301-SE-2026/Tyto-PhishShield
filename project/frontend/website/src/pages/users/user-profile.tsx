import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/toast-context';
import { API_BASE, authFetch } from '../../services/api';
import { ShieldCheck, Star, Search, BookOpen, Check, TriangleAlert, Award } from 'lucide-react';

interface UserProfileProps {
  onNavigate: (path: string) => void;
  activePath: string;
  userId?: string;
}

interface FetchedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  xp: number;
  createdAt: string;
}

const ACHIEVEMENTS = [
  { id: '1', name: 'First Responder', desc: 'Reported 10 phishing emails', earned: true, icon: <ShieldCheck size={18} /> },
  { id: '2', name: 'Eagle Eye', desc: '0 clicks for 30 days', earned: true, icon: <Search size={18} /> },
  { id: '3', name: 'Top Defender', desc: 'Rank #1 in organisation', earned: false, icon: <Star size={18} /> },
  { id: '4', name: 'Scholar', desc: 'Complete 5 training modules', earned: false, icon: <BookOpen size={18} /> },
];

const ACTIVITY = [
  { type: 'report', title: 'Reported phishing email: "URGENT: Password expiry notice"', time: '2 hours ago', xp: 50, color: 'var(--color-success)', borderColor: 'var(--color-success-border)', bg: 'var(--color-success-light)', icon: <Check size={14} strokeWidth={2.5} color='#fff' />, iconBg: 'var(--color-success)' },
  { type: 'training', title: 'Completed: Introduction to Social Engineering', time: 'Yesterday', xp: 120, color: 'var(--color-primary)', borderColor: 'var(--color-primary-mid)', bg: 'var(--color-primary-light)', icon: <BookOpen size={14} color='#fff' />, iconBg: 'var(--color-primary)' },
  { type: 'click', title: 'Clicked simulation: "IT Support Password Reset"', time: '3 days ago', xp: -20, color: 'var(--color-warning)', borderColor: 'var(--color-warning-border)', bg: 'var(--color-warning-light)', icon: <TriangleAlert size={14} strokeWidth={2.5} color='#fff' />, iconBg: 'var(--color-warning)' },
  { type: 'badge', title: 'Earned badge: Eagle Eye', time: '1 week ago', xp: 0, color: 'var(--text-secondary)', borderColor: 'var(--border)', bg: 'var(--bg-hover)', icon: <Award size={14} color='#fff' />, iconBg: 'var(--text-muted)' },
];

const DEPT_STATS = [
  { dept: 'IT & Security', rank: '#2', members: 12, avgXp: 3800 },
  { dept: 'All departments', rank: '#4', members: 87, avgXp: 2100 },
];

export function UserProfile({ onNavigate, activePath, userId }: UserProfileProps) {
  const { user: currentUser, hasRole } = useAuth();
  const { addToast } = useToast();
  const isOwnProfile = !userId;
  const isAdmin = hasRole('admin');
  const [fetchedUser, setFetchedUser] = useState<FetchedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(!!userId);
  useEffect(() => {
    if (!userId) return;
    setLoadingUser(true);
    authFetch(`${API_BASE}/accounts/users/${userId}`)
      .then(r => r.ok ? r.json() as Promise<FetchedUser> : Promise.reject(new Error(String(r.status))))
      .then(data => setFetchedUser(data))
      .catch(() => addToast({ type: 'error', title: 'Could not load user', message: 'User may not exist or you lack access.' }))
      .finally(() => setLoadingUser(false));
  }, [userId]);

  const initials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    return (email ?? '??').slice(0, 2).toUpperCase();
  };

  const profileUser = isOwnProfile ? {
    name: currentUser?.name ?? currentUser?.email?.split('@')[0] ?? 'User',
    email: currentUser?.email ?? '',
    role: currentUser?.role ?? 'user',
    department: null as string | null,
    xp: 0, rank: 4, streak: 12, reportsField: 28,
    initials: initials(currentUser?.name, currentUser?.email),
    accuracy: 88,
  } : fetchedUser ? {
    name: fetchedUser.name ?? '—',
    email: fetchedUser.email,
    role: fetchedUser.role,
    department: fetchedUser.department,
    xp: fetchedUser.xp, rank: 4, streak: 12, reportsField: 28,
    initials: initials(fetchedUser.name, fetchedUser.email),
    accuracy: 88,
  } : {
    name: '…', email: '…', role: 'user', department: null,
    xp: 0, rank: 0, streak: 0, reportsField: 0, initials: '…', accuracy: 0,
  };
  const xpTarget = 5000;
  const xpPct = Math.min((profileUser.xp / xpTarget) * 100, 100);
  if (!isOwnProfile && loadingUser) {
    return (
      <AppLayout activePath={activePath} onNavigate={onNavigate} title="Loading…">
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Loading user profile.
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title={isOwnProfile ? 'My Profile' : profileUser.name}
      breadcrumbs={isOwnProfile ? undefined : [
        { label: 'Users', path: '/users' },
        { label: profileUser.name },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 16, alignItems: 'start' }}>
        {/* Profile card */}
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
                { k: 'Department', v: profileUser.department ?? '—' },
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