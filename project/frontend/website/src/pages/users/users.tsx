import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import { API_BASE, authFetch, authApi } from '../../services/api';
import { fetchLeaderboardXp } from '../leaderboard/leaderboard.service';
import { connectXpSocket } from '../../services/xp-socket';
import { ShieldCheck, Check, User, Search, Trash2, Ban, Lock } from 'lucide-react';

type UserRole = 'admin' | 'analyst' | 'user';

interface UsersProps { onNavigate: (path: string) => void; activePath: string; }

interface RealUser {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  xp: number;
  xpToday: number;
  createdAt: string;
  status: 'active' | 'suspended';
}

type AccountsUser = Omit<RealUser, 'xp' | 'xpToday' | 'status'>;
type SortKey = 'name' | 'xp' | 'email';

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access — manage users, phishing waves, analytics',
  analyst: 'Can view phishing waves, analytics and reports',
  user: 'Standard access — training and personal dashboard only',
};

function UserActionsModal({ user, isOpen, onClose, onNavigate }: {
  user: RealUser | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { addToast } = useToast();
  const { hasRole } = useAuth();
  const [view, setView] = useState<'actions' | 'editRole'>('actions');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [saving, setSaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen && user) {
      setView('actions');
      setSelectedRole(user.role as UserRole);
    }
  }

  if (!user) return null;

  const handleRoleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/accounts/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Server error ${res.status}`);
      }
      addToast({ type: 'success', title: 'Role updated', message: `${user.name} is now ${selectedRole}.` });
      onClose();
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setSaving(true);
    try {
      await authApi.forgotPassword(user.email);
      addToast({ type: 'success', title: 'Reset email sent', message: `Password reset link sent to ${user.email}.` });
      onClose();
    } catch (err) {
      addToast({ type: 'error', title: 'Could not send reset email', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/accounts/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      addToast({ type: 'success', title: 'User removed', message: `${user.name} has been removed.` });
      onClose();
    } catch {
      addToast({ type: 'error', title: 'Remove failed', message: 'Could not remove user. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const actionBtn = (label: string, icon: React.ReactNode, onClick: () => void, danger = false) => (
    <button key={label} onClick={onClick} style={{
      background: danger ? 'var(--color-danger-light)' : 'var(--bg-hover)',
      border: `1px solid ${danger ? 'var(--color-danger-border)' : 'var(--border)'}`,
      borderRadius: 8, padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
      fontSize: 13, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif',
      color: danger ? 'var(--color-danger)' : 'var(--text-primary)',
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      transition: 'opacity 0.12s',
    }}>
      <span style={{ opacity: 0.7, display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
  if (view === 'editRole') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Role" maxWidth={400}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Changing the role of <strong>{user.name}</strong>. They will see the new permissions on their next page refresh.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {(['admin', 'analyst', 'user'] as UserRole[]).map(r => {
            const isCurrent = r === (user.role as UserRole);
            const isSelected = r === selectedRole;
            return (
              <button key={r} onClick={() => setSelectedRole(r)} style={{
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-input)',
                transition: 'all 0.15s', width: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'capitalize' }}>
                    {r}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCurrent && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif', background: 'var(--bg-hover)', borderRadius: 4, padding: '1px 6px' }}>
                        current
                      </span>
                    )}
                    {isSelected && (
                      <Check size={14} strokeWidth={3} color='var(--color-primary)' />
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {ROLE_DESCRIPTIONS[r]}
                </p>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setView('actions')}>Back</Button>
          <Button fullWidth loading={saving} disabled={selectedRole === (user.role as UserRole)} onClick={() => { void handleRoleSave(); }}>
            Save Role
          </Button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage — ${user.name}`} maxWidth={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hasRole('admin') && actionBtn('Edit Role', <ShieldCheck size={14} />, () => setView('editRole'))}
        {actionBtn('View User', (
          <User size={14} />
        ), () => { onClose(); onNavigate(`/users/${user.id}`); })}
        {hasRole('admin') && actionBtn('Reset Password', (
          <Lock size={14} />
        ), () => { void handleResetPassword(); })}
        {hasRole('admin') && actionBtn(
          user.status === 'suspended' ? 'Reinstate User' : 'Suspend User',
          <Ban size={14} />,
          () => { addToast({ type: 'warning', title: user.status === 'suspended' ? 'User reinstated' : 'User suspended', message: `${user.name} — note: full Auth0 block requires a backend update.` }); onClose(); },
          user.status !== 'suspended',
        )}
        {hasRole('admin') && actionBtn('Remove User', (
          <Trash2 size={14} />
        ), () => { void handleRemove(); }, true)}
      </div>
    </Modal>
  );
}

export function Users({ onNavigate, activePath }: UsersProps) {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/accounts/users`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as AccountsUser[];
      let xpByAuth0Id = new Map<string, number>();
      try {
        const xpEntries = await fetchLeaderboardXp();
        xpByAuth0Id = new Map(xpEntries.map(e => [e.auth0Id, e.totalXp]));
      } catch {
        addToast({ type: 'error', title: 'XP totals unavailable', message: 'Showing 0 XP until xp-service responds.' });
      }
      setUsers(data.map(u => ({
        ...u,
        xp: xpByAuth0Id.get(u.auth0Id) ?? 0,
        xpToday: 0,
        status: 'active' as const,
      })));
    } catch {
      addToast({ type: 'error', title: 'Could not load users', message: 'Check that you have admin access.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  useEffect(() => { void fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    let cancelled = false;
    let socket: Awaited<ReturnType<typeof connectXpSocket>> | undefined;
    connectXpSocket().then(s => {
        if (cancelled) { s.disconnect(); return; }
        socket = s;
        s.on('xp-given-all', ({ auth0Id, amount }: { auth0Id: string; amount: number }) => {
          setUsers(prev => prev.map(u => u.auth0Id === auth0Id ? { ...u, xp: u.xp + amount } : u));
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      if (q && !u.name?.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.name ?? '').localeCompare(b.name ?? '');
      if (sortKey === 'email') cmp = a.email.localeCompare(b.email);
      if (sortKey === 'xp') cmp = (a.xp ?? 0) - (b.xp ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => toggleSort(k)} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  const initials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    return (email ?? '??').slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Users"
      subtitle={loading ? 'Loading…' : `${filtered.length} of ${users.length} users`}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={14} aria-hidden='true'/>}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer' }}>
          {['all', 'admin', 'analyst', 'user'].map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Button variant="ghost" onClick={() => { void fetchUsers(); }} style={{ border: '1px solid var(--border)', padding: '0 14px' }}>
          Refresh
        </Button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Loading users...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  <SortBtn k="name" label="USER" />
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>ROLE</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>DEPARTMENT</th>
                  <SortBtn k="xp" label="XP" />
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>JOINED</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {initials(u.name, u.email)}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'analyst' ? 'warning' : 'neutral'}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {u.department ?? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {(u.xp ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-ZA') : '—'}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <Button variant="primary"
                        onClick={() => { setSelectedUser(u); setActionsOpen(true); }}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>
              No users match your search criteria.
            </div>
          )}
        </div>
      </Card>
      <UserActionsModal user={selectedUser} isOpen={actionsOpen} onClose={() => { setActionsOpen(false); void fetchUsers(); }} onNavigate={onNavigate} />
    </AppLayout>
  );
}