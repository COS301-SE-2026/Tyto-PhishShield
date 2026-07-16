import { API_BASE, authFetch } from '../../services/api';

export interface RealUser {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  xp: number;
  createdAt: string;
}

export async function fetchLeaderboardUsers(): Promise<RealUser[]> {
  const res = await authFetch(`${API_BASE}/accounts/users`);
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
  return res.json() as Promise<RealUser[]>;
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

// department field doesn't exist yet server-side (need to add in an update from backend)
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

// groups real users by department once that field is actually populated - "Unassigned" for now.
export function groupUsersByDepartment(users: RealUser[]): DepartmentGroup[] {
  const groups = new Map<string, RealUser[]>();
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