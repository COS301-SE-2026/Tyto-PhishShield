import {
  fetchEmployees,
  importEmployeesCsv,
  type Employee,
  type ImportResult,
} from './company';
import { API_BASE, authFetch, getToken } from './api';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');

  return {
    ...actual,
    authFetch: vi.fn(),
    getToken: vi.fn(),
  };
});

const mockFetch = vi.fn<typeof fetch>();
const mockAuthFetch = vi.mocked(authFetch);
const mockGetToken = vi.mocked(getToken);

function createMockResponse(
  ok: boolean,
  data: unknown,
  status = 200,
): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('fetchEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return employees', async () => {
    const employees: Employee[] = [
      {
        employeeId: 'EMP001',
        email: 'employee1@example.com',
        firstName: 'Test',
        lastName: 'Employee',
        department: 'IT',
        jobTitle: 'Developer',
        dateImported: '2026-09-20T12:00:00.000Z',
        registered: false,
      },
      {
        employeeId: 'EMP002',
        email: 'employee2@example.com',
        dateImported: '2026-09-20T12:00:00.000Z',
        registered: true,
      },
    ];

    mockAuthFetch.mockResolvedValue(
      createMockResponse(true, employees),
    );

    const result = await fetchEmployees();

    expect(result).toEqual(employees);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      `${API_BASE}/company/employees`,
    );
  });

  it('should throw an error when fetching employees fails', async () => {
    mockAuthFetch.mockResolvedValue(
      createMockResponse(false, {}, 500),
    );

    await expect(fetchEmployees()).rejects.toThrow(
      'Failed to load employees (500)',
    );
  });
});

describe('importEmployeesCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should import a CSV without a mapping and return the result', async () => {
    const backendResponse: ImportResult = {
      id: 'import-123',
      fileName: 'employees.csv',
      fileSize: 100,
      fileType: '.csv',
    };

    const file = new File(
      [
        'employeeId,email\n' +
        'EMP001,employee1@example.com',
      ],
      'employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('test-token');

    mockFetch.mockResolvedValue(
      createMockResponse(true, backendResponse),
    );

    const result = await importEmployeesCsv(file);

    expect(result).toEqual(backendResponse);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE}/company/import`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        body: expect.any(FormData),
      }),
    );

    const request = mockFetch.mock.calls[0]?.[1];

    expect(request).toBeDefined();

    const formData = request?.body;

    expect(formData).toBeInstanceOf(FormData);

    if (!(formData instanceof FormData)) {
      throw new Error('Expected request body to be FormData');
    }

    expect(formData.get('file')).toBe(file);
    expect(formData.has('mapping')).toBe(false);
  });

  it('should include the CSV mapping when provided', async () => {
    const backendResponse: ImportResult = {
      id: 'import-456',
      fileName: 'custom-employees.csv',
      fileSize: 120,
      fileType: '.csv',
    };

    const file = new File(
      [
        'Staff Number,Work Email\n' +
        'EMP001,employee1@example.com',
      ],
      'custom-employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('test-token');

    mockFetch.mockResolvedValue(
      createMockResponse(true, backendResponse),
    );

    const result = await importEmployeesCsv(file, {
      employeeId: 'Staff Number',
      email: 'Work Email',
    });

    expect(result).toEqual(backendResponse);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE}/company/import`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        body: expect.any(FormData),
      }),
    );

    const request = mockFetch.mock.calls[0]?.[1];

    expect(request).toBeDefined();

    const formData = request?.body;

    expect(formData).toBeInstanceOf(FormData);

    if (!(formData instanceof FormData)) {
      throw new Error('Expected request body to be FormData');
    }

    expect(formData.get('file')).toBe(file);
    expect(formData.get('mapping')).toBe(
      JSON.stringify({
        employeeId: 'Staff Number',
        email: 'Work Email',
      }),
    );
  });

  it('should include the authorisation token', async () => {
    const backendResponse: ImportResult = {
      id: 'import-123',
      fileName: 'employees.csv',
      fileSize: 100,
      fileType: '.csv',
    };

    const file = new File(
      ['employeeId,email'],
      'employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('company-test-token');

    mockFetch.mockResolvedValue(
      createMockResponse(true, backendResponse),
    );

    await importEmployeesCsv(file);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE}/company/import`,
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer company-test-token',
        },
      }),
    );
  });

  it('should throw the backend error message when importing fails', async () => {
    const file = new File(
      ['employeeId,email'],
      'employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('test-token');

    mockFetch.mockResolvedValue(
      createMockResponse(
        false,
        {
          message: 'CSV column does not exist',
        },
        400,
      ),
    );

    await expect(
      importEmployeesCsv(file),
    ).rejects.toThrow('CSV column does not exist');
  });

  it('should throw a fallback error when the backend has no message', async () => {
    const file = new File(
      ['employeeId,email'],
      'employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('test-token');

    mockFetch.mockResolvedValue(
      createMockResponse(
        false,
        {
          error: 'Unknown error',
        },
        500,
      ),
    );

    await expect(
      importEmployeesCsv(file),
    ).rejects.toThrow('Import failed (500)');
  });

  it('should throw a fallback error when the error response is not valid JSON', async () => {
    const file = new File(
      ['employeeId,email'],
      'employees.csv',
      { type: 'text/csv' },
    );

    mockGetToken.mockReturnValue('test-token');

    const response = {
      ok: false,
      status: 400,
      json: vi.fn().mockRejectedValue(
        new Error('Invalid JSON'),
      ),
    } as unknown as Response;

    mockFetch.mockResolvedValue(response);

    await expect(
      importEmployeesCsv(file),
    ).rejects.toThrow('Import failed (400)');
  });
});