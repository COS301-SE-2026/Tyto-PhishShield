import { API_BASE, authFetch } from '../../services/api';
import { getWave, type Wave, type WaveRecipient } from '../../services/wave';
import { fetchAnalyticsSummary, fetchTimeSeries, fetchLeaderboard, getPeriodRange,
  type Period, type AnalyticsSummary, type TimeSeriesPoint, type LeaderboardEntry, } from './analytics.service';

export interface AccountUser {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  createdAt: string;
}

interface UserStatsResponse {
  reports: number;
  confirmed: number;
  falsePositive: number;
  totalXp: number;
  educationCompleted: number;
  securityScore: number;
}

async function getAccountsJson<T>(path: string): Promise<T> {
  const res = await authFetch(`${API_BASE}/accounts${path}`);
  if (!res.ok) throw new Error(`Failed to load account data (${res.status})`);
  return res.json() as Promise<T>;
}

async function getAnalyticsJson<T>(path: string): Promise<T> {
  const res = await authFetch(`${API_BASE}/analytics${path}`);
  if (!res.ok) throw new Error(`Failed to load analytics data (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchAllUsers(): Promise<AccountUser[]> {
  return getAccountsJson<AccountUser[]>('/users');
}

export function fetchUserById(id: string): Promise<AccountUser> {
  return getAccountsJson<AccountUser>(`/users/${id}`);
}

function fetchUserStats(auth0Id: string): Promise<UserStatsResponse> {
  return getAnalyticsJson<UserStatsResponse>(`/users/${auth0Id}`);
}

export async function fetchDepartmentOptions(): Promise<string[]> {
  const users = await fetchAllUsers();
  const departments = new Set(users.map(u => u.department).filter((d): d is string => !!d));
  return Array.from(departments).sort((a, b) => a.localeCompare(b));
}

export interface OrganisationReport {
  type: 'organisation';
  generatedAt: string;
  period: Period;
  summary: AnalyticsSummary;
  series: TimeSeriesPoint[];
  leaderboard: LeaderboardEntry[];
}

export interface UserReport {
  type: 'user';
  generatedAt: string;
  user: AccountUser;
  stats: UserStatsResponse;
}

export interface WaveReportRecipient extends WaveRecipient {
  name: string;
  email: string;
  department: string | null;
  /** Per-recipient open/click/report/ignore status isn't computable yet. */
  engagement: 'pending';
}

export interface WaveReport {
  type: 'wave';
  generatedAt: string;
  wave: Wave;
  recipients: WaveReportRecipient[];
}

export interface DepartmentReport {
  type: 'department';
  generatedAt: string;
  department: string;
  employees: AccountUser[];
}

export type GeneratedReport = OrganisationReport | UserReport | WaveReport | DepartmentReport;

export async function fetchOrganisationReport(period: Period): Promise<OrganisationReport> {
  const { from, to } = getPeriodRange(period);
  const [summary, series, leaderboard] = await Promise.all([
    fetchAnalyticsSummary(period),
    fetchTimeSeries(from, to),
    fetchLeaderboard(10),
  ]);
  return { type: 'organisation', generatedAt: new Date().toISOString(), period, summary, series, leaderboard };
}

export async function fetchUserReport(userId: string): Promise<UserReport> {
  const user = await fetchUserById(userId);
  const stats = await fetchUserStats(user.auth0Id);
  return { type: 'user', generatedAt: new Date().toISOString(), user, stats };
}

export async function fetchWaveReport(waveId: string): Promise<WaveReport> {
  const [wave, users] = await Promise.all([getWave(waveId), fetchAllUsers()]);
  const byAuth0Id = new Map(users.map(u => [u.auth0Id, u]));
  const recipients: WaveReportRecipient[] = wave.recipients.map(r => {
    const match = byAuth0Id.get(r.auth0Id);
    return {
      ...r,
      name: match?.name ?? 'Unknown',
      email: match?.email ?? '—',
      department: match?.department ?? null,
      engagement: 'pending',
    };
  });
  return { type: 'wave', generatedAt: new Date().toISOString(), wave, recipients };
}

export async function fetchDepartmentReport(department: string): Promise<DepartmentReport> {
  const users = await fetchAllUsers();
  const employees = users.filter(u => u.department === department);
  return { type: 'department', generatedAt: new Date().toISOString(), department, employees };
}