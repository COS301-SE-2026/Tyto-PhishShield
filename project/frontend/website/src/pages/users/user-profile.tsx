import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/toast-context';
import { API_BASE, authFetch } from '../../services/api';
import { ShieldCheck, Star, Search, BookOpen, Check, TriangleAlert, Award, Trash2 } from 'lucide-react';

interface UserProfileProps {
  onNavigate: (path: string) => void;
  activePath: string;
  userId?: string;
}

interface FetchedUser {
  id: string;
  auth0Id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  xp: number;
  createdAt: string;
}

type XpReason = 'report' | 'delete' | 'quiz' | 'refused' | 'ignored' | 'compromised';

interface XpEntry {
  id: string;
  amount: number;
  reason: XpReason | null;
  createdAt: string;
}

interface RawXpNet {
  totalXp: number;
  user: { auth0Id: string; name: string; email: string; department: string | null };
}

interface Report {
  id: string;
  emailSubject?: string;
  status: 'pending' | 'reviewed' | 'confirmed_phishing' | 'false_positive';
  createdAt: string;
}

interface Assignment {
  id: string;
  status: 'pending' | 'passed' | 'failed';
  createdAt: string;
}

interface AnalyticsStats {
  reports: number;
  confirmed: number;
  falsePositive: number;
  educationCompleted: number;
  totalXp: number;
  securityScore: number;
}

const LEVELS = [
  { name: 'Bronze',   min: 0 },
  { name: 'Silver',   min: 1_000 },
  { name: 'Gold',     min: 5_000 },
  { name: 'Platinum', min: 10_000 },
  { name: 'Diamond',  min: 25_000 },
] as const;

function getLevelProgress(xp: number) {
  let idx = LEVELS.length - 1;
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp < LEVELS[i + 1].min) { idx = i; break; }
  }
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1] as typeof LEVELS[number] | undefined;
  if (!next) return { current: level.name, next: null as string | null, pct: 100, xpInLevel: xp - level.min, xpRange: 0 };
  const xpInLevel = xp - level.min;
  const xpRange = next.min - level.min;
  return { current: level.name, next: next.name, pct: Math.min((xpInLevel / xpRange) * 100, 100), xpInLevel, xpRange };
}

function computeStreak(entries: XpEntry[]): number {
  if (!entries.length) return 0;
  const days = [...new Set(entries.map(e => e.createdAt.slice(0, 10)))].sort().reverse();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yestStr  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (days[0] !== todayStr && days[0] !== yestStr) return 0;
  let streak = 0;
  let cur = days[0];
  for (const d of days) {
    if (d !== cur) break;
    streak++;
    const dt = new Date(cur + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() - 1);
    cur = dt.toISOString().slice(0, 10);
  }
  return streak;
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(ms / 86_400_000);
  if (mins  < 2)  return 'Just now';
  if (hours < 1)  return `${mins} minutes ago`;
  if (days  < 1)  return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days  < 7)  return `${days} days ago`;
  if (days  < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

type ActivityType = 'report' | 'training' | 'click' | 'delete' | 'badge';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  xp: number;
}

const REASON_MAP: Record<XpReason, { type: ActivityType; title: string }> = {
  report:      { type: 'report',   title: 'Reported phishing email' },
  delete:      { type: 'delete',   title: 'Safely deleted phishing email' },
  quiz:        { type: 'training', title: 'Completed training module' },
  refused:     { type: 'report',   title: 'Refused phishing simulation' },
  ignored:     { type: 'badge',    title: 'Ignored phishing email' },
  compromised: { type: 'click',    title: 'Clicked phishing simulation' },
};

function buildActivity(xpEntries: XpEntry[]): ActivityItem[] {
  return [...xpEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(e => {
      const cfg = e.reason ? REASON_MAP[e.reason] : undefined;
      return { id: e.id, type: cfg?.type ?? 'badge', title: cfg?.title ?? 'XP awarded', time: formatTimeAgo(e.createdAt), xp: e.amount };
    });
}

const ACTIVITY_STYLES: Record<ActivityType, { borderColor: string; bg: string; iconBg: string }> = {
  report:   { borderColor: 'var(--color-success-border)', bg: 'var(--color-success-light)', iconBg: 'var(--color-success)' },
  delete:   { borderColor: 'var(--color-success-border)', bg: 'var(--color-success-light)', iconBg: 'var(--color-success)' },
  training: { borderColor: 'var(--color-primary-mid)',    bg: 'var(--color-primary-light)', iconBg: 'var(--color-primary)' },
  click:    { borderColor: 'var(--color-warning-border)', bg: 'var(--color-warning-light)', iconBg: 'var(--color-warning)' },
  badge:    { borderColor: 'var(--border)',               bg: 'var(--bg-hover)',            iconBg: 'var(--text-muted)' },
};

const ACTIVITY_ICONS = {
  report:   <Check size={14} strokeWidth={2.5} color='#fff' />,
  delete:   <Trash2 size={14} color='#fff' />,
  training: <BookOpen size={14} color='#fff' />,
  click:    <TriangleAlert size={14} strokeWidth={2.5} color='#fff' />,
  badge:    <Award size={14} color='#fff' />,
};

interface AchievementItem {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
}

const ACHIEVEMENT_DEFS = [
  { id: '1', name: 'First Responder', desc: 'Reported 10 phishing emails' },
  { id: '2', name: 'Eagle Eye',       desc: '0 clicks for 30 days' },
  { id: '3', name: 'Top Defender',    desc: 'Rank #1 in organisation' },
  { id: '4', name: 'Scholar',         desc: 'Complete 5 training modules' },
] as const;

const ACHIEVEMENT_ICONS: Record<string, (typeof ACTIVITY_ICONS)[keyof typeof ACTIVITY_ICONS]> = {
  '1': <ShieldCheck size={18} />,
  '2': <Search size={18} />,
  '3': <Star size={18} />,
  '4': <BookOpen size={18} />,
};

interface ProfileStats {
  xp: number;
  rank: number | null;
  reportsCount: number;
  streak: number;
  accuracy: number | null;
  department: string | null;
  achievements: AchievementItem[];
  activity: ActivityItem[];
  deptRank: number;
  deptMembers: number;
  deptAvgXp: number;
  allRank: number | null;
  allMembers: number;
  allAvgXp: number;
}

export function UserProfile({ onNavigate, activePath, userId }: UserProfileProps) {
  const { user: currentUser, hasRole } = useAuth();
  const { addToast } = useToast();
  const isOwnProfile = !userId;
  const isAdmin = hasRole('admin');
  const [fetchedUser, setFetchedUser] = useState<FetchedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(!!userId);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoadingUser(true);
    const load = async (): Promise<void> => {
      try {
        const res = await authFetch(`${API_BASE}/accounts/users/${userId}`);
        if (!res.ok) throw new Error(String(res.status));
        setFetchedUser(await res.json() as FetchedUser);
      } catch {
        addToast({ type: 'error', title: 'Could not load user', message: 'User may not exist or you lack access.' });
      } finally {
        setLoadingUser(false);
      }
    };
    void load();
  }, [userId, addToast]);

  const profileAuth0Id = isOwnProfile ? currentUser?.auth0Id : fetchedUser?.auth0Id;
  // Fetch all live stats
  useEffect(() => {
    if (!profileAuth0Id) return;
    setLoadingStats(true);

    const load = async (): Promise<void> => {
      try {
        const fetches: Promise<Response>[] = [
          authFetch(`${API_BASE}/xp/net`),
          authFetch(`${API_BASE}/xp/${profileAuth0Id}`),
        ];
        // Own profile
        if (isOwnProfile) {
          fetches.push(authFetch(`${API_BASE}/report/mine`));
          fetches.push(authFetch(`${API_BASE}/education/history/mine`));
        }

        const [lbRes, xpRes, ...rest] = await Promise.all(fetches);
        const rawLb: RawXpNet[]   = lbRes.ok  ? await lbRes.json()  as RawXpNet[]   : [];
        const xpEntries: XpEntry[] = xpRes.ok  ? await xpRes.json()  as XpEntry[]   : [];
        const reports: Report[]    = (isOwnProfile && rest[0]?.ok) ? await rest[0].json() as Report[]    : [];
        const assignments: Assignment[] = (isOwnProfile && rest[1]?.ok) ? await rest[1].json() as Assignment[] : [];

        let adminStats: AnalyticsStats | null = null;
        if (!isOwnProfile && isAdmin) {
          try {
            const sRes = await authFetch(`${API_BASE}/analytics/users/${profileAuth0Id}`);
            if (sRes.ok) adminStats = await sRes.json() as AnalyticsStats;
          } catch { /* endpoint may not be available */ }
        }

        const lb = rawLb.map(e => ({ auth0Id: e.user.auth0Id, department: e.user.department, totalXp: e.totalXp }));
        const lbSorted = [...lb].sort((a, b) => b.totalXp - a.totalXp);
        const myIdx = lbSorted.findIndex(u => u.auth0Id === profileAuth0Id);
        const xp   = myIdx !== -1 ? lbSorted[myIdx].totalXp : 0;
        const rank = myIdx !== -1 ? myIdx + 1 : null;
        const department = isOwnProfile
          ? (myIdx !== -1 ? lbSorted[myIdx].department : null)
          : (fetchedUser?.department ?? null);

        let reportsCount = 0;
        let confirmed    = 0;
        let passedModules = 0;

        if (isOwnProfile) {
          reportsCount  = reports.length;
          confirmed     = reports.filter(r => r.status === 'confirmed_phishing').length;
          passedModules = assignments.filter(a => a.status === 'passed').length;
        } else if (adminStats) {
          reportsCount  = adminStats.reports;
          confirmed     = adminStats.confirmed;
          passedModules = adminStats.educationCompleted;
        }

        const accuracy = reportsCount > 0 ? Math.round((confirmed / reportsCount) * 100) : null;
        const streak   = computeStreak(xpEntries);
        const deptUsers  = department ? lb.filter(u => u.department === department) : [];
        const deptSorted = [...deptUsers].sort((a, b) => b.totalXp - a.totalXp);
        const deptRank   = deptSorted.findIndex(u => u.auth0Id === profileAuth0Id) + 1;
        const deptAvgXp  = deptSorted.length ? Math.round(deptSorted.reduce((s, u) => s + u.totalXp, 0) / deptSorted.length) : 0;
        const allAvgXp = lbSorted.length ? Math.round(lbSorted.reduce((s, u) => s + u.totalXp, 0) / lbSorted.length) : 0;
        const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
        const recentClicks  = xpEntries.filter(e => e.reason === 'compromised' && new Date(e.createdAt).getTime() >= thirtyDaysAgo);
        const hasRecentActivity = xpEntries.some(e => new Date(e.createdAt).getTime() >= thirtyDaysAgo);
        const achievements: AchievementItem[] = [
          { ...ACHIEVEMENT_DEFS[0], earned: reportsCount >= 10 },
          { ...ACHIEVEMENT_DEFS[1], earned: hasRecentActivity && recentClicks.length === 0 },
          { ...ACHIEVEMENT_DEFS[2], earned: rank === 1 },
          { ...ACHIEVEMENT_DEFS[3], earned: passedModules >= 5 },
        ];

        setProfileStats({
          xp, rank, reportsCount, streak, accuracy, department,
          achievements,
          activity: buildActivity(xpEntries),
          deptRank,
          deptMembers: deptSorted.length,
          deptAvgXp,
          allRank: rank,
          allMembers: lbSorted.length,
          allAvgXp,
        });
      } catch (err) {
        console.error('Failed to load profile stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    void load();
  }, [profileAuth0Id, isOwnProfile, isAdmin, fetchedUser]);

  const initials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return (email ?? '??').slice(0, 2).toUpperCase();
  };

  const baseUser = isOwnProfile
    ? { name: currentUser?.name ?? currentUser?.email?.split('@')[0] ?? 'User', email: currentUser?.email ?? '', role: currentUser?.role ?? 'user' }
    : { name: fetchedUser?.name ?? '—', email: fetchedUser?.email ?? '…', role: fetchedUser?.role ?? 'user' };

  const xp        = profileStats?.xp ?? 0;
  const levelInfo = getLevelProgress(xp);
  const statRows = [
    { k: 'XP Points',           v: loadingStats ? '—' : xp.toLocaleString() },
    { k: 'Organisation Rank',   v: loadingStats ? '—' : (profileStats?.rank != null ? `#${profileStats.rank}` : '—') },
    { k: 'Reports Filed',       v: loadingStats ? '—' : (profileStats ? String(profileStats.reportsCount) : '—') },
    { k: 'Current Streak',      v: loadingStats ? '—' : `${profileStats?.streak ?? 0} days` },
    { k: 'Detection Accuracy',  v: loadingStats ? '—' : (profileStats?.accuracy != null ? `${profileStats.accuracy}%` : '—') },
    { k: 'Department',          v: loadingStats ? '—' : (profileStats?.department ?? '—') },
  ];

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
      title={isOwnProfile ? 'My Profile' : baseUser.name}
      breadcrumbs={isOwnProfile ? undefined : [
        { label: 'Users', path: '/users' },
        { label: baseUser.name },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            {/* Header */}
            <div style={{ background: 'linear-gradient(140deg, #0F172A, #1E3A5F)', padding: '24px 20px 18px', textAlign: 'center' }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 auto 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {initials(baseUser.name, baseUser.email)}
              </div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif' }}>{baseUser.name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, marginTop: 2, marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>{baseUser.email}</p>
              <span style={{ background: 'rgba(37,99,235,0.3)', color: '#93C5FD', fontSize: 10, fontWeight: 600, padding: '3px 11px', borderRadius: 9999, border: '1px solid rgba(37,99,235,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {baseUser.role.charAt(0).toUpperCase() + baseUser.role.slice(1)}
              </span>
            </div>
            {/* Stats */}
            <div style={{ padding: '12px 16px' }}>
              {statRows.map(s => (
                <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-hover)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.k}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.v}</span>
                </div>
              ))}
            </div>
            {/* Level progress */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Level progress</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {levelInfo.next ? `${levelInfo.current} → ${levelInfo.next}` : levelInfo.current}
                </span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 20, height: 7 }}>
                <div style={{ background: 'var(--color-primary)', height: 7, borderRadius: 20, width: `${levelInfo.pct}%`, transition: 'width 1s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {levelInfo.next
                  ? `${levelInfo.xpInLevel.toLocaleString()} / ${levelInfo.xpRange.toLocaleString()} XP`
                  : 'Max level reached'}
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
          {/* Department Stats */}
          <Card style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Department Stats</h3>
            {loadingStats ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</div>
            ) : ( <>
                {/* Users department */}
                {profileStats?.department && (
                <DeptRow
                    label={profileStats.department}
                    rank={profileStats.deptRank > 0 ? profileStats.deptRank : null}
                    members={profileStats.deptMembers}
                    avgXp={profileStats.deptAvgXp}
                  />
                )}
                {/* Org-wide */}
                <DeptRow
                  label="All departments"
                  rank={profileStats?.allRank ?? null}
                  members={profileStats?.allMembers ?? 0}
                  avgXp={profileStats?.allAvgXp ?? 0}
                />
              </>
            )}
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Achievements */}
          <Card style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>Achievements</h3>
            {loadingStats ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {(profileStats?.achievements ?? ACHIEVEMENT_DEFS.map(d => ({ ...d, earned: false }))).map(a => (
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
                      {ACHIEVEMENT_ICONS[a.id]}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.earned ? 'var(--color-primary)' : 'var(--text-secondary)', marginBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, fontFamily: 'Inter, system-ui, sans-serif' }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {/* Recent Activity */}
          <Card style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>Recent Activity</h3>
            {loadingStats ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</div>
            ) : (profileStats?.activity.length ?? 0) === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontFamily: 'Inter, system-ui, sans-serif' }}>
                No activity yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(profileStats?.activity ?? []).map(a => {
                  const s = ACTIVITY_STYLES[a.type];
                  return (
                    <div key={a.id} style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '10px 13px', borderRadius: 8,
                      background: s.bg, border: `1px solid ${s.borderColor}`,
                    }}>
                      <div style={{ width: 28, height: 28, background: s.iconBg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {ACTIVITY_ICONS[a.type]}
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
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function DeptRow({ label, rank, members, avgXp }: { label: string; rank: number | null; members: number; avgXp: number }) {
  return (
    <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{label}</div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{rank != null ? `#${rank}` : '—'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Rank</div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{members}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Members</div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{avgXp.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Avg XP</div>
        </div>
      </div>
    </div>
  );
}