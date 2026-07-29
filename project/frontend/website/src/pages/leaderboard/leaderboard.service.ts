import { API_BASE, authFetch } from '../../services/api';

export interface XpNetEntry {
  auth0Id: string;
  name: string;
  email: string;
  department: string | null;
  totalXp: number;
}

export interface RawNetXpEntry {
  totalXp: number;
  user: { auth0Id: string; name: string; email: string; department: string | null };
}

// Only includes users with at least one XP entry (below)
export async function fetchLeaderboardXp(): Promise<XpNetEntry[]> {
  const res = await authFetch(`${API_BASE}/xp/net`);
  if (!res.ok) throw new Error(`Failed to load XP (${res.status})`);
  const raw = await res.json() as RawNetXpEntry[];
  return raw.map(entry => ({
    auth0Id: entry.user.auth0Id,
    name: entry.user.name,
    email: entry.user.email,
    department: entry.user.department,
    totalXp: entry.totalXp, 
}));
}

export function getInitials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts.at(-1)![0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email ?? '??').slice(0, 2).toUpperCase();
}

export function resolveDepartment(department?: string | null): string {
  const trimmed = department?.trim();
  if (!trimmed) return 'Unassigned';
  return trimmed;
}

export interface DepartmentGroup {
  department: string;
  members: number;
  totalXP: number;
  averageXP: number;
}

interface DepartmentSource {
  department: string | null;
  xp: number;
}

// groups by department. Accounts with no department falls under "Unassigned".
export function groupUsersByDepartment(users: readonly DepartmentSource[]): DepartmentGroup[] {
  const groups = new Map<string, DepartmentSource[]>();
  for (const u of users) {
    const key = resolveDepartment(u.department);
    const list = groups.get(key) ?? [];
    list.push(u);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([department, members]) => {
    const totalXP = members.reduce((sum, m) => sum + (m.xp ?? 0), 0);
    return {
      department,
      members: members.length,
      totalXP,
      averageXP: members.length ? Math.round(totalXP / members.length) : 0,
    };
  });
}