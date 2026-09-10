import { API_BASE, authFetch } from './api';
import { getMyEducationHistory, type Assignment } from './education';

export interface XpEntry {
  id: string;
  amount: number;
  reason: 'report' | 'delete' | 'quiz' | 'refused' | 'ignored' | 'compromised' | null;
  createdAt: string;
}

export interface ReportEntry {
  id: string;
  emailSubject?: string;
  status: 'pending' | 'reviewed' | 'confirmed_phishing' | 'false_positive';
  createdAt: string;
  updatedAt: string;
}

export function fetchXpHistory(auth0Id: string): Promise<XpEntry[]> {
  return getJson<XpEntry[]>(`${API_BASE}/xp/${auth0Id}`, 'Failed to load XP history');
}

export function fetchMyReports(): Promise<ReportEntry[]> {
  return getJson<ReportEntry[]>(`${API_BASE}/report/mine`, 'Failed to load reports');
}

async function getJson<T>(url: string, failureMessage: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) throw new Error(failureMessage);
  return res.json() as Promise<T>;
}

export type NotificationType = 'xp' | 'training' | 'report';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
}

const XP_REASON_LABEL: Record<NonNullable<XpEntry['reason']>, string> = {
  report: 'reported a phishing email',
  delete: 'safely deleted a suspicious email',
  quiz: 'completed a training quiz',
  refused: 'refused a suspicious request',
  ignored: 'ignored a simulation for too long',
  compromised: 'fell for a phishing simulation',
};

function xpToNotification(entry: XpEntry): AppNotification {
  const sign = entry.amount >= 0 ? '+' : '−';
  const reasonLabel = entry.reason ? XP_REASON_LABEL[entry.reason] : 'an XP adjustment';
  return {
    id: `xp-${entry.id}`,
    type: 'xp',
    title: `${sign}${Math.abs(entry.amount)} XP`,
    message: `You ${reasonLabel}.`,
    timestamp: entry.createdAt,
  };
}

function assignmentToNotification(assignment: Assignment): AppNotification | null {
  if (assignment.status !== 'pending') return null;
  return {
    id: `training-${assignment.id}`,
    type: 'training',
    title: 'New training assigned',
    message: 'A new training assignment is waiting for you.',
    timestamp: assignment.createdAt,
  };
}

function reportToNotification(report: ReportEntry): AppNotification | null {
  if (report.status === 'pending') return null;
  const subject = report.emailSubject ? `'${report.emailSubject}'` : 'your reported email';
  const message = report.status === 'confirmed_phishing'
    ? `Your report on ${subject} was confirmed as phishing.`
    : report.status === 'false_positive'
      ? `Your report on ${subject} was marked as a false positive.`
      : `Your report on ${subject} was reviewed.`;
  return {
    id: `report-${report.id}`,
    type: 'report',
    title: 'Report update',
    message,
    timestamp: report.updatedAt,
  };
}

const MAX_NOTIFICATIONS = 20;

export function buildNotifications(xp: XpEntry[], assignments: Assignment[], reports: ReportEntry[]): AppNotification[] {
  const notifications = [
    ...xp.map(xpToNotification),
    ...assignments.map(assignmentToNotification).filter((n): n is AppNotification => n !== null),
    ...reports.map(reportToNotification).filter((n): n is AppNotification => n !== null),
  ];
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return notifications.slice(0, MAX_NOTIFICATIONS);
}

export async function fetchNotifications(auth0Id: string): Promise<AppNotification[]> {
  const [xp, assignments, reports] = await Promise.all([
    fetchXpHistory(auth0Id),
    getMyEducationHistory(),
    fetchMyReports(),
  ]);
  return buildNotifications(xp, assignments, reports);
}