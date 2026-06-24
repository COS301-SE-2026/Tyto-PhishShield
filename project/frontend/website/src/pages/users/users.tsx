import { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';

interface UsersProps { onNavigate: (path: string) => void; activePath: string; }

const MOCK_USERS = [
  { id: '1', name: 'Sipho Ndlovu', email: 'sipho@tyto.co.za', role: 'user', department: 'IT & Security', xp: 4820, reportsField: 34, clickRate: '2%', streak: 21, status: 'active' },
  { id: '2', name: 'Aisha Patel', email: 'aisha@tyto.co.za', role: 'analyst', department: 'IT & Security', xp: 4310, reportsField: 28, clickRate: '4%', streak: 14, status: 'active' },
  { id: '3', name: 'Marco van Dyk', email: 'marco@tyto.co.za', role: 'user', department: 'Finance', xp: 3990, reportsField: 22, clickRate: '6%', streak: 9, status: 'active' },
  { id: '4', name: 'Lebo Dlamini', email: 'lebo@tyto.co.za', role: 'analyst', department: 'Operations', xp: 3560, reportsField: 28, clickRate: '8%', streak: 12, status: 'active' },
  { id: '5', name: 'Fatima Hassan', email: 'fatima@tyto.co.za', role: 'user', department: 'Human Resources', xp: 3210, reportsField: 15, clickRate: '12%', streak: 5, status: 'active' },
  { id: '6', name: 'Jan de Beer', email: 'jan@tyto.co.za', role: 'user', department: 'Finance', xp: 2870, reportsField: 12, clickRate: '18%', streak: 2, status: 'suspended' },
  { id: '7', name: 'Nadia Botha', email: 'nadia@tyto.co.za', role: 'user', department: 'Legal & Compliance', xp: 2540, reportsField: 9, clickRate: '22%', streak: 0, status: 'active' },
  { id: '8', name: 'Mark Marshall', email: 'mark@tyto.co.za', role: 'admin', department: 'IT & Security', xp: 1200, reportsField: 6, clickRate: '5%', streak: 3, status: 'active' },
];

type SortKey = 'name' | 'xp' | 'clickRate' | 'streak';

function UserActionsModal({ user, isOpen, onClose }: { user: typeof MOCK_USERS[0] | null; isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const { hasRole } = useAuth();
  if (!user) return null;

  const actions = [
    { label: 'Edit Role', icon: '✏️', adminOnly: true, onClick: () => { addToast({ type: 'info', title: 'Edit Role', message: `Role editor for ${user.name} — coming soon.` }); onClose(); } },
    { label: 'View Full Stats', icon: '📊', adminOnly: false, onClick: () => { onClose(); } },
    { label: 'Reset Password', icon: '🔑', adminOnly: true, onClick: () => { addToast({ type: 'success', title: 'Reset email sent', message: `Password reset link sent to ${user.email}` }); onClose(); } },
    { label: user.status === 'suspended' ? 'Reinstate User' : 'Suspend User', icon: user.status === 'suspended' ? '✅' : '🚫', adminOnly: true,
      danger: user.status !== 'suspended',
      onClick: () => { addToast({ type: 'warning', title: user.status === 'suspended' ? 'User reinstated' : 'User suspended', message: user.name }); onClose(); } },
    { label: 'Remove User', icon: '🗑️', adminOnly: true, danger: true, onClick: () => { addToast({ type: 'error', title: 'User removed', message: `${user.name} has been removed.` }); onClose(); } },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage — ${user.name}`} maxWidth={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.filter(a => !a.adminOnly || hasRole('admin')).map(a => (
          <button key={a.label} onClick={a.onClick} style={{
            background: a.danger ? 'var(--color-danger-light)' : 'var(--bg-hover)',
            border: `1px solid ${a.danger ? 'var(--color-danger-border)' : 'var(--border)'}`,
            borderRadius: 8, padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif',
            color: a.danger ? 'var(--color-danger)' : 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'background 0.12s',
          }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function Users({ onNavigate, activePath }: UsersProps) {
  //const { canAccess } = useAuth();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('xp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const filtered = MOCK_USERS
    .filter(u => {
      const q = search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDir === 'asc' ? comparison : -comparison;
      }

      let av = 0;
      let bv = 0;

      if (sortKey === 'xp') {
        av = a.xp;
        bv = b.xp;
      }

      if (sortKey === 'streak') {
        av = a.streak;
        bv = b.streak;
      }

      if (sortKey === 'clickRate') {
        av = parseFloat(a.clickRate);
        bv = parseFloat(b.clickRate);
      }

      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  const depts = ['all', ...new Set(MOCK_USERS.map(u => u.department))];

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Users" subtitle={`${filtered.length} of ${MOCK_USERS.length} users`} securityScore={72}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
          />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer' }}>
          {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer' }}>
          {['all','admin','analyst','user'].map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                <SortBtn k="name" label="USER" />
                <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>DEPARTMENT</th>
                <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>ROLE</th>
                <SortBtn k="xp" label="XP" />
                <SortBtn k="streak" label="STREAK" />
                <SortBtn k="clickRate" label="CLICK RATE" />
                <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>STATUS</th>
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
                    <button onClick={() => onNavigate(`/users/${u.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', flexShrink: 0 }}>
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.email}</div>
                      </div>
                    </button>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.department}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'analyst' ? 'warning' : 'neutral'}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.xp.toLocaleString()}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: u.streak > 7 ? 'var(--color-success)' : 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.streak}d</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
                    color: parseFloat(u.clickRate) > 15 ? 'var(--color-danger)' : parseFloat(u.clickRate) > 8 ? 'var(--color-warning)' : 'var(--color-success)',
                    fontWeight: 600,
                  }}>{u.clickRate}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                      {u.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Button size="sm" variant="ghost"
                      onClick={() => { setSelectedUser(u); setActionsOpen(true); }}
                      style={{ 
                        border: '1px solid var(--border)',
                        minWidth: 80,
                        paddingLeft: 16,
                        paddingRight: 16,
                      }}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>
              No users match your search criteria.
            </div>
          )}
        </div>
      </Card>

      <UserActionsModal user={selectedUser} isOpen={actionsOpen} onClose={() => setActionsOpen(false)} />
    </AppLayout>
  );
}
