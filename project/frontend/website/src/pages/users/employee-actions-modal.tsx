import { useState, type CSSProperties } from 'react';
import { Button, Modal } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import {
  deleteEmployee,
  updateEmployee,
  type Employee,
  type FailedImport,
  type UpdateEmployeeRequest,
} from '../../services/company';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

type EditableKey =
  | 'email' | 'firstName' | 'lastName' | 'department' | 'jobTitle'
  | 'title' | 'managerId' | 'employeeStatus' | 'externalId';

const FIELDS: { key: EditableKey; label: string }[] = [
  { key: 'email', label: 'Email *' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'department', label: 'Department' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'title', label: 'Title' },
  { key: 'managerId', label: 'Manager ID' },
  { key: 'employeeStatus', label: 'Employee Status' },
  { key: 'externalId', label: 'External ID' },
];

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: 12,
};

function isFailedImport(value: Employee | FailedImport): value is FailedImport {
  return 'errorMessage' in value;
}

function employeeToForm(employee: Employee): UpdateEmployeeRequest {
  return {
    employeeId: employee.employeeId,
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    title: employee.title,
    managerId: employee.managerId,
    employeeStatus: employee.employeeStatus,
    externalId: employee.externalId,
    registered: employee.registered,
    auth0Id: employee.auth0Id,
  };
}

export function EmployeeActionsModal({
  employee, isOpen, onClose, onChanged,
}: Props) {
  const { addToast } = useToast();
  const actionBtn = (label: string, icon: React.ReactNode, onClick: () => void, danger = false) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            background: danger ? 'var(--color-danger-light)' : 'var(--bg-hover',
            border: `1px solid ${danger ? 'var(--color-danger-border)' : 'var(--border)'}`,
            borderRadius: 8,
            padding: 12,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: danger ? 'var(--color-danger)' :'var(--text-primary)',
            alignItems: 'center',
            gap:12,
            width: '100%',
            transition: 'opacity 0.12s'
        }}
    >
        <span 
            style={{ 
                opacity: 0.7, 
                display: 'flex'
            }}
        >
            {icon}
        </span>
        {label}
    </button>
  )
  const [view, setView] = useState<'actions' | 'edit' | 'delete'>('actions');
  const [form, setForm] = useState<UpdateEmployeeRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [previousEmployee, setPreviousEmployee] = useState<Employee | null>(null);
  const [previousOpen, setPreviousOpen] = useState(isOpen);

  if (isOpen !== previousOpen || employee !== previousEmployee) {
    setPreviousOpen(isOpen);
    setPreviousEmployee(employee);
    setView('actions');
    setForm(employee ? employeeToForm(employee) : null);
  }

  if (!employee || !form) return null;

  const displayName =
    `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() ||
    employee.email;

  const close = () => {
    if (!saving) onClose();
  };

  const handleSave = async () => {
    if (!form.email.trim() || saving) return;
    setSaving(true);
    try {
      const result = await updateEmployee(employee.employeeId, {
        ...form,
        email: form.email.trim(),
      });
      if (isFailedImport(result)) {
        throw new Error(result.errorMessage);
      }
      addToast({
        type: 'success',
        title: 'Employee updated',
        message: `${displayName} was updated.`,
      });
      onChanged();
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const deleted = await deleteEmployee(employee.employeeId);
      if (!deleted) throw new Error('Employee was not found or could not be deleted.');
      addToast({
        type: 'success',
        title: 'Employee deleted',
        message: `${displayName} was removed from the company roster.`,
      });
      onChanged();
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`${view === 'edit' ? 'Edit' : view === 'delete' ? 'Delete' : 'Manage'} — ${displayName}`}
      maxWidth={view === 'actions'? 380: 480}
    >
      {view === 'actions' && (
        <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8,
            }}
        >
          {actionBtn(
            'Edit Employee',
            <Pencil size={14} />,
            () => setView('edit'),
          )}

          {actionBtn(
            'Delete Employee',
            <Trash2 size={14} />,
            () => setView('delete'),
            true,
          )}
        </div>
      )}
      {view === 'edit' && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Employee ID: {employee.employeeId} (cannot be changed here)
          </p>
          <div style={{ maxHeight: 370, overflowY: 'auto', marginBottom: 16 }}>
            {FIELDS.map(field => (
              <label key={field.key} style={{
                display: 'block', fontSize: 12, marginBottom: 10,
                color: 'var(--text-secondary)',
              }}>
                <span style={{ display: 'block', marginBottom: 4 }}>
                  {field.label}
                </span>
                <input
                  style={inputStyle}
                  value={form[field.key] ?? ''}
                  disabled={saving}
                  onChange={e => setForm(previous => previous && ({
                    ...previous,
                    [field.key]: e.target.value,
                  }))}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => setView('actions')} disabled={saving}>
              Back
            </Button>
            <Button
              fullWidth
              loading={saving}
              disabled={!form.email.trim()}
              onClick={() => { void handleSave(); }}
            >
              Save Changes
            </Button>
          </div>
        </>
      )}
      {view === 'delete' && (
        <>
          <p style={{
            fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)',
          }}>
            Delete {displayName} from the company roster? 
            This action cannot be undone here.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => setView('actions')} disabled={saving}>
              Cancel
            </Button>
            <Button 
                fullWidth 
                loading={saving} 
                onClick={() => { void handleDelete();}}
                style={{
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color danger-border)',
                }}
            >
              Confirm Delete
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
