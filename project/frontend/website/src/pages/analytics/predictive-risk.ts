import type { AccountUser } from './reports.service';
import type { DepartmentBreakdown, AtRiskUser } from './analytics.service';

export interface PredictedRiskUser {
  auth0Id: string;
  name: string;
  department: string | null;
  predictedRisk: number;
}

export function computePredictedRisk(
  users: AccountUser[],
  departments: DepartmentBreakdown[],
  currentAtRisk: AtRiskUser[],
  limit = 5,
  perDepartmentCap = 2,
): PredictedRiskUser[] {
  const deptClickRate = new Map(departments.map(d => [d.department, d.clickRate]));
  const alreadyFlagged = new Set(currentAtRisk.map(u => u.auth0Id));
  const orgAverage = departments.length > 0
    ? departments.reduce((sum, d) => sum + d.clickRate, 0) / departments.length
    : 0;

  const scored = users
    .filter(u => u.role === 'user' && !alreadyFlagged.has(u.auth0Id))
    .map(u => ({
      auth0Id: u.auth0Id,
      name: u.name || u.email,
      department: u.department,
      predictedRisk: Math.round(u.department ? (deptClickRate.get(u.department) ?? orgAverage) : orgAverage),
    }))
    .filter(u => u.predictedRisk > 0)
    .sort((a, b) => b.predictedRisk - a.predictedRisk);

  const deptCounts = new Map<string, number>();
  const result: PredictedRiskUser[] = [];
  for (const candidate of scored) {
    const key = candidate.department ?? '__none__';
    const count = deptCounts.get(key) ?? 0;
    if (count >= perDepartmentCap) continue;
    deptCounts.set(key, count + 1);
    result.push(candidate);
    if (result.length >= limit) break;
  }
  return result;
}