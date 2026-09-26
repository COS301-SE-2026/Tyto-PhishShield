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
  registered: boolean;
  auth0Id?: string;
  title?:string;
  dateImported: string;
}

export interface ImportResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface EmployeeCsvMapping {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  title?: string;
  managerId?: string;
  managerEmail?: string;
  employeeStatus?: string;
  externalId?: string;
  registered?: string;
}

export interface UpdateEmployeeRequest {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  managerId?: string;
  employeeStatus?: string;
  externalId?: string;
  registered?: boolean;
  auth0Id?: string;
  title?: string;
}

export interface ImportRecord extends ImportResult{
  importType: number;
  mapping?: EmployeeCsvMapping | null;
  totalRows?: number;
  processedRows?: number;
  status?: boolean;
  addedEmployees?: number;
  updatedEmployees?: number;
  dateImported: string;
  dateUpdated:string;
}

export interface FailedImport {
  id: string;
  data: string;
  errorMessage: string;
}

export type CompanyFields = Record<string, string>;

interface ErrorResponse {
  message?: string | string[];
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ErrorResponse | null;
    const message = Array.isArray(error?.message) ? error.message.join(', ') :error?.message;

    throw new Error(message ?? `${fallbackMessage} (${response.status})`);
  }

  return data as T;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await authFetch(`${COMPANY_BASE}/employees`);
  return readResponse<Employee[]>(res, 'Failed to load employees');
}

export async function fetchEmployee(
  employeeId: string,
): Promise<Employee> {
  const res = await authFetch(
    `${COMPANY_BASE}/employees/${encodeURIComponent(employeeId)}`,
  );

  return readResponse<Employee>(res, 'Failed to load employee');
}

export async function updateEmployee(
  employeeId: string,
  employee: UpdateEmployeeRequest,
): Promise<Employee | FailedImport> {
  const res = await authFetch(
    `${COMPANY_BASE}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    },
  );

  return readResponse<Employee | FailedImport>(
    res,
    'Failed to update employee',
  );
}

export async function deleteEmployee(
  employeeId: string,
): Promise<boolean> {
  const res = await authFetch(
    `${COMPANY_BASE}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'DELETE',
    },
  );

  return readResponse<boolean>(res, 'Failed to delete employee');
}

export async function fetchImports(): Promise<ImportRecord[]> {
  const res = await authFetch(`${COMPANY_BASE}/imports`);

  return readResponse<ImportRecord[]>(res, 'Failed to load imports');
}

export async function fetchImport(
  importId: string,
): Promise<ImportRecord> {
  const res = await authFetch(
    `${COMPANY_BASE}/imports/${encodeURIComponent(importId)}`,
  );

  return readResponse<ImportRecord>(res, 'Failed to load import');
}

export async function importEmployeesCsv(
  file: File,
  mapping?: EmployeeCsvMapping,
): Promise<ImportResult> {
  const formData = new FormData();

  formData.append('file', file);

  if (mapping) {
    formData.append('mapping', JSON.stringify(mapping));
  }

  const res = await fetch(`${COMPANY_BASE}/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  return readResponse<ImportResult>(res, 'Failed to import employees');
}

export async function fetchCompanyFields(): Promise<CompanyFields> {
  const res = await authFetch(`${COMPANY_BASE}/fields`);

  return readResponse<CompanyFields>(
    res,
    'Failed to load company fields',
  );
}

//Imports
export async function fetchFailedImports(): Promise<FailedImport[]> {
  const res = await authFetch(`${COMPANY_BASE}/imports/errors`);

  return readResponse<FailedImport[]>(
    res,
    'Failed to load failed imports',
  );
}

export async function deleteFailedImport(
  errorId: string,
): Promise<boolean> {
  const res = await authFetch(
    `${COMPANY_BASE}/imports/error/${encodeURIComponent(errorId)}`,
    {
      method: 'DELETE',
    },
  );

  return readResponse<boolean>(
    res,
    'Failed to delete failed import',
  );
}