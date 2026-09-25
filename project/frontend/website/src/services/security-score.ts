import { API_BASE, authFetch } from './api';

export interface UserStats {
  reports: number;
  confirmed: number;
  falsePositive: number;
  totalXp: number;
  educationCompleted: number;
  securityScore: number;
}

export async function fetchSecurityScore(auth0Id: string): Promise<number> {
  const res = await authFetch(`${API_BASE}/analytics/users/${auth0Id}`);
  if (!res.ok) throw new Error(`Failed to load security score (${res.status})`);
  const stats = await res.json() as UserStats;
  return stats.securityScore;
}