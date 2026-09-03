import { useState} from 'react';
import { AuthLayout } from '../../components/layout/auth-layout';
import { Input, PasswordInput, Select, Button } from '../../components/ui';
import { authApi } from '../../services/api';
import { useToast } from '../../context/toast-context';

interface RegisterProps {
  onNavigate: (path: string) => void;
}

type Step = 1 | 2 | 3;

const DEPARTMENTS = [
  { value: 'it_security', label: 'IT & Security' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'operations', label: 'Operations' },
  { value: 'executive', label: 'Executive' },
];

// Check password strength
function PwHints({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div style={{
      background: 'var(--bg-hover)', borderRadius: 8, padding: '8px 12px',
      display: 'flex', gap: 14, flexWrap: 'wrap',
    }}>
      {checks.map(c => (
        <span key={c.label} style={{
          fontSize: 11, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif',
          color: c.ok ? 'var(--color-success)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {c.ok ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
          )}
          {c.label}
        </span>
      ))}
    </div>
  );
}

// Step sidebar
function StepSidebar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Account details', desc: 'Name, email, password' },
    { n: 2, label: 'Organisation', desc: 'Oganisation and Department' },
    { n: 3, label: 'Check your email', desc: 'Verify your email address' },
  ];

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
          {/* Header block */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{color: '#fff', fontSize: 21, fontWeight: 700, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif', }}>
              Set up your account
            </h2>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, system-ui, sans-serif', }}>
              Complete your profile to access PhishShield.
            </p>
          </div>

          {/* Steps list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {steps.map(s => {
              const done = step > s.n;
              const active = step === s.n;

              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 14}}>
                  {/* Number circle */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: done ? 'var(--color-success)' : active ? '#2563EB' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    color: (done || active) ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}>
                    {done ? '✓' : s.n}
                  </div>
                  {/* Text block */}
                  <div>
                    <div style={{fontSize: 13, fontWeight: 600, color: (done || active) ? '#fff' : 'rgba(255,255,255,0.4)', }}>
                      {s.label}
                    </div>
                    <div style={{fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2, }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
    </div>
  );
}

export function Register({ onNavigate }: RegisterProps) {
  const { addToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [department, setDepartment] = useState('it_security');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    if (!email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Minimum 8 characters.';
    return e;
  };

  const handleStep1Continue = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setStep1Errors(e); return; }
    setStep1Errors({});
    setStep(2);
  };
  const step2Valid = !!department;

  const handleStep2Continue = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      await authApi.register({
        email, password, name: `${firstName} ${lastName}`.trim(),
        department: DEPARTMENTS.find(d => d.value === department)?.label,
      });
      addToast({ type: 'info', title: 'Confirmation email sent', message: `Check ${email} to verify your account.` });
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP verification now happens at first login — see handleOtpVerify/handleResendOtp in pages/auth/login.tsx

    const rightPanel = (
    <div style={{ 
        width: '100%', 
        maxWidth: 450,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: '32px 34px',
     }}>
      {/* Step 1 */}
      {step === 1 && (
        <>
          <div style={{
            display: 'inline-block', background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 9999, letterSpacing: '.3px',
            marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            STEP 1 OF 3
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Enter your details to get started.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Input label="First name" placeholder="Lisa" value={firstName}
                onChange={e => { setFirstName(e.target.value); setStep1Errors(p => ({ ...p, firstName: '' })); }}
                error={step1Errors.firstName} required />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Last name" placeholder="Jacobs" value={lastName}
                onChange={e => { setLastName(e.target.value); setStep1Errors(p => ({ ...p, lastName: '' })); }}
                error={step1Errors.lastName} required />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input label="Work email" type="email" placeholder="lisa@tyto.co.za" value={email}
              onChange={e => { setEmail(e.target.value); setStep1Errors(p => ({ ...p, email: '' })); }}
              error={step1Errors.email} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <PasswordInput label="Password" placeholder="Min. 8 characters" value={password}
              onChange={e => { setPassword(e.target.value); setStep1Errors(p => ({ ...p, password: '' })); }}
              error={step1Errors.password} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <PwHints password={password} />
          </div>
          <Button fullWidth size="lg" onClick={handleStep1Continue} style={{ width: '100%', padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8, }}>
            Continue
          </Button>
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Already registered?{' '}
            <button
              onClick={() => onNavigate('/login')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Sign in
            </button>
          </p>
        </>
      )}
      {/* Step 2 */}
      {step === 2 && (
        <>
          <div style={{
            display: 'inline-block', background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 9999, letterSpacing: '.3px',
            marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            STEP 2 OF 3
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Your organisation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Help us configure your access correctly.
          </p>
          <div style={{ marginBottom: 12 }}>
            <Input label="Organisation" value="Tyto" readOnly
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Select
              label="Department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              options={DEPARTMENTS}
            />
          </div>
          {submitError && (
            <div style={{
              background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
              color: 'var(--color-danger)', fontFamily: 'Inter, system-ui, sans-serif',
            }}> {submitError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => { setSubmitError(''); setStep(1); }}
              style={{ padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: '1.5px solid var(--border)' }}>
              Back
            </Button>
            <Button fullWidth loading={loading} onClick={() => { void handleStep2Continue(); }} disabled={!step2Valid}
              style={{ width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8 }}>
              Continue
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{
            display: 'inline-block', background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 9999, letterSpacing: '.3px',
            marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            STEP 3 OF 3
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22, fontFamily: 'Inter, system-ui, sans-serif' }}>
            A confirmation email has been sent to <strong>{email}</strong>. Click the link in that email to verify and activate your account.
          </p>
          <Button fullWidth size="lg" onClick={() => onNavigate('/login')}
            style={{ width: '100%', padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
            Go to login
          </Button>
        </>
      )}
    </div>
  );
  return (
    <AuthLayout
      leftContent={<StepSidebar step={step} />}
      rightContent={rightPanel}
      onLogoClick={() => onNavigate('/')}
      onHelpClick={() => onNavigate('/help')}
    />
  );
}