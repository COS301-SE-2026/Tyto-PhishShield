import { API_BASE, authFetch } from '../../services/api';

export type Period = '7d' | '30d' | '90d';

interface OverviewResponse {
  totalEmailsSent: number;
  totalReports: number;
  confirmedPhishing: number;
  falsePositives: number;
  totalXpGiven: number;
  educationAssigned: number;
  educationCompleted: number;
}

interface ReportStatsResponse {
  submitted: number;
  confirmed: number;
  falsePositive: number;
  detectionRate: number;
}

interface MailingStatsResponse {
  totalSent: number;
  scheduled: number;
}

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

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(`${API_BASE}/analytics${path}`);
  if (!res.ok) throw new Error(`Failed to load analytics (${res.status})`);
  return res.json() as Promise<T>;
}

function fetchOverview(): Promise<OverviewResponse> {
  return getJson<OverviewResponse>('/overview');
}

function fetchReportStats(from: string, to: string): Promise<ReportStatsResponse> {
  return getJson<ReportStatsResponse>(`/reports?from=${from}&to=${to}`);
}

function fetchMailingStats(from: string, to: string): Promise<MailingStatsResponse> {
  return getJson<MailingStatsResponse>(`/mailing?from=${from}&to=${to}`);
}

export function fetchTimeSeries(from: string, to: string): Promise<TimeSeriesPoint[]> {
  return getJson<TimeSeriesPoint[]>(`/timeseries?from=${from}&to=${to}`);
}

export function fetchLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  return getJson<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

export function getPeriodRange(period: Period): { from: string; to: string; prevFrom: string; prevTo: string } {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 86_400_000).toISOString();
  const prevTo = from;
  const prevFrom = new Date(new Date(from).getTime() - days * 86_400_000).toISOString();
  return { from, to, prevFrom, prevTo };
}

export interface AnalyticsSummary {
  detectionRate: number;
  detectionRateDelta: number;
  totalSimulations: number;
  totalSimulationsDelta: number;
  trainingCompletionRate: number;
  educationAssigned: number;
  educationCompleted: number;
}

export async function fetchAnalyticsSummary(period: Period): Promise<AnalyticsSummary> {
  const { from, to, prevFrom, prevTo } = getPeriodRange(period);
  const [reportStats, prevReportStats, mailingStats, prevMailingStats, overview] = await Promise.all([
    fetchReportStats(from, to),
    fetchReportStats(prevFrom, prevTo),
    fetchMailingStats(from, to),
    fetchMailingStats(prevFrom, prevTo),
    fetchOverview(),
  ]);

  const trainingCompletionRate = overview.educationAssigned > 0 ? Math.round((overview.educationCompleted / overview.educationAssigned) * 100) : 0;

  return {
    detectionRate: reportStats.detectionRate,
    detectionRateDelta: reportStats.detectionRate - prevReportStats.detectionRate,
    totalSimulations: mailingStats.totalSent,
    totalSimulationsDelta: mailingStats.totalSent - prevMailingStats.totalSent,
    trainingCompletionRate,
    educationAssigned: overview.educationAssigned,
    educationCompleted: overview.educationCompleted,
  };
}
