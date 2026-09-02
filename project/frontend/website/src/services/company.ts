import { API_BASE, authFetch, getToken } from './api';

const COMPANY_BASE = `${API_BASE}/company`;

export interface Employee {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  managerId?: string;
  employeeStatus?: string;
  externalId?: string;
  dateImported: string;
  registered: boolean;
}

export interface ImportResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await authFetch(`${COMPANY_BASE}/employees`);
  if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
  return res.json() as Promise<Employee[]>;
}

export async function importEmployeesCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${COMPANY_BASE}/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const message = (data as { message?: string } | null)?.message;
    throw new Error(message ?? `Import failed (${res.status})`);
  }

  return res.json() as Promise<ImportResult>;
}