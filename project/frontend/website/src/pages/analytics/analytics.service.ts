import { API_BASE, authFetch } from '../../services/api';

export type Period = '7d' | '30d' | '90d';

export interface TimeSeriesPoint {
  date: string;
  reports: number;
  emailsSent: number;
  xpGiven: number;
}

export interface LeaderboardEntry {
  auth0Id: string;
  email: string;
  totalXp: number;
  reportCount: number;
}

export interface MetricWithDelta {
  value: number;
  delta: number;
}

export interface AnalyticsSummary {
  detectionRate: MetricWithDelta;
  clickRate: MetricWithDelta;
  totalSimulations: MetricWithDelta;
  atRiskUsers: MetricWithDelta;
  trainingCompletion: MetricWithDelta;
}

export interface DepartmentBreakdown {
  department: string;
  sent: number;
  reported: number;
  detectionRate: number;
  clickRate: number;
}

export interface AtRiskUser {
  auth0Id: string;
  name?: string;
  department?: string;
  clickRate: number;
  riskLevel: 'high' | 'medium';
}

export interface Campaign {
  id: string;
  name?: string;
  status?: string;
  targetDepartments?: string[];
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(`${API_BASE}/analytics${path}`);
  if (!res.ok) throw new Error(`Failed to load analytics (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchTimeSeries(from: string, to: string): Promise<TimeSeriesPoint[]> {
  return getJson<TimeSeriesPoint[]>(`/timeseries?from=${from}&to=${to}`);
}

export function fetchLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  return getJson<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
}

export function fetchAnalyticsSummary(period: Period): Promise<AnalyticsSummary> {
  return getJson<AnalyticsSummary>(`/summary?period=${period}`);
}

export function fetchByDepartment(period: Period): Promise<DepartmentBreakdown[]> {
  return getJson<DepartmentBreakdown[]>(`/by-department?period=${period}`);
}

export function fetchAtRiskUsers(period: Period, limit = 10): Promise<AtRiskUser[]> {
  return getJson<AtRiskUser[]>(`/at-risk-users?period=${period}&limit=${limit}`);
}

export function fetchCampaigns(): Promise<Campaign[]> {
  return getJson<Campaign[]>('/campaigns');
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

export function getPeriodRange(period: Period): { from: string; to: string } {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 86_400_000).toISOString();
  return { from, to };
}