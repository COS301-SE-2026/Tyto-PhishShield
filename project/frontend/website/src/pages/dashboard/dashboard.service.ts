import { API_BASE, authFetch } from '../../services/api';

export interface XpNetEntry {
  auth0Id: string;
  name: string;
  email: string;
  department: string | null;
  totalXp: number;
}

interface RawNetXpEntry {
  totalXp: number;
  user: { auth0Id: string; name: string; email: string; department: string | null };
}

export async function fetchXpNet(): Promise<XpNetEntry[]> {
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

export interface MyXpRank {
  xp: number;
  rank: number | null;
  totalRanked: number;
}

export function computeMyXpRank(entries: XpNetEntry[], auth0Id: string): MyXpRank {
  const sorted = [...entries].sort((a, b) => b.totalXp - a.totalXp);
  const idx = sorted.findIndex(e => e.auth0Id === auth0Id);
  if (idx === -1) {
    return { xp: 0, rank: null, totalRanked: sorted.length };
  }
  return { xp: sorted[idx].totalXp, rank: idx + 1, totalRanked: sorted.length };
}