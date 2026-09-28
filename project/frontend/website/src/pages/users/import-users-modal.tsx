import { useState, type ChangeEvent, type CSSProperties } from 'react';
import { Upload } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import {
  importEmployeesCsv,
  type EmployeeCsvMapping,
} from '../../services/company';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type MappingKey = keyof EmployeeCsvMapping;
type MappingState = Partial<Record<MappingKey, string>>;

const FIELDS: { key: MappingKey; label: string; required?: boolean }[] = [
  { key: 'employeeId', label: 'Employee ID', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'department', label: 'Department' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'title', label: 'Title' },
  { key: 'managerId', label: 'Manager ID' },
  { key: 'managerEmail', label: 'Manager Email' },
  { key: 'employeeStatus', label: 'Employee Status' },
  { key: 'externalId', label: 'External ID' },
  { key: 'registered', label: 'Registered' },
];

// Handles quoted CSV headers, including commas and escaped quotes.
function parseHeader(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      result.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('Unclosed quote in CSV header.');
  result.push(value.trim());
  return result;
}

const selectStyle: CSSProperties = {
  width: '100%',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 12,
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

export function ImportUsersModal({ isOpen, onClose, onImported }: Props) {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<MappingState>({});
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    reset();
    if (!selected) return;
    try {
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please select a CSV file.');
      }
      const content = await selected.text();
      const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
      if (!firstLine?.trim()) throw new Error('The CSV has no header row.');
      // Basic delimiter detection; the backend must support the chosen delimiter.
      const delimiter = [',', ';', '\t'].sort(
        (a, b) => parseHeader(firstLine, b).length - parseHeader(firstLine, a).length,
      )[0];
      const columns = parseHeader(firstLine, delimiter);
      if (columns.some(h => !h) || new Set(columns).size !== columns.length) {
        throw new Error('CSV headers must be nonempty and unique.');
      }
      const initial: MappingState = {};
      const used = new Set<string>();
      for (const field of FIELDS) {
        const exact = columns.find(h => h === field.key);
        const similar = columns.find(
          h => h.toLowerCase().replace(/[\s_-]/g, '') ===
            field.key.toLowerCase().replace(/[\s_-]/g, ''),
        );
        const match = exact ?? similar;
        if (match && !used.has(match)) {
          initial[field.key] = match;
          used.add(match);
        }
      }
      setFile(selected);
      setHeaders(columns);
      setMapping(initial);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not read CSV',
        message: error instanceof Error ? error.message : 'Invalid CSV.',
      });
    }
  };

  const values = Object.values(mapping).filter((value): value is string => !!value);
  const duplicate = new Set(values).size !== values.length;
  const valid = !!file && !!mapping.employeeId && !!mapping.email && !duplicate;

  const handleUpload = async () => {
    if (!file || !valid || uploading) return;
    setUploading(true);
    try {
      // Send explicit mapping for every selected field, even if headers match.
      await importEmployeesCsv(file, mapping as EmployeeCsvMapping);
      addToast({
        type: 'success',
        title: 'Import submitted',
        message: 'Check the employee roster and import errors for processing results.',
      });
      reset();
      onImported();
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import Users" maxWidth={520}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Upload a CSV and map its columns to employee fields. Employee ID and
        email are required. Unselected optional fields will not be imported.
      </p>
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: 22, margin: '16px 0', border: '1.5px dashed var(--border)',
        borderRadius: 10, cursor: 'pointer', background: 'var(--bg-hover)',
      }}>
        <Upload size={20} aria-hidden="true" />
        <span style={{ fontSize: 12 }}>{file?.name ?? 'Choose CSV file'}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={e => { void handleFile(e); }}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
      {file && (
        <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Map CSV columns</p>
          {FIELDS.map(field => (
            <label key={field.key} style={{
              display: 'block', marginBottom: 10, fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              <span style={{ display: 'block', marginBottom: 4 }}>
                {field.label}{field.required ? ' *' : ''}
              </span>
              <select
                style={selectStyle}
                value={mapping[field.key] ?? ''}
                disabled={uploading}
                onChange={e => setMapping(previous => ({
                  ...previous,
                  [field.key]: e.target.value || undefined,
                }))}
              >
                <option value="">Do not map</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </label>
          ))}
          {duplicate && (
            <p style={{ fontSize: 12, color: 'var(--color-danger)' }}>
              Each CSV column can only be assigned to one field.
            </p>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" onClick={close} disabled={uploading}>Cancel</Button>
        <Button
          fullWidth
          loading={uploading}
          disabled={!valid}
          onClick={() => { void handleUpload(); }}
        >
          Upload
        </Button>
      </div>
    </Modal>
  );
}
