import { useState} from 'react';
import { AuthLayout } from '../../components/layout/auth-layout';
import { Input, PasswordInput, Select, Button, OtpInput } from '../../components/ui';
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

const ROLES = ['User', 'Analyst', 'Admin'] as const;

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
    { n: 2, label: 'Organisation', desc: 'Department and role' },
    { n: 3, label: 'Confirm OTP', desc: 'Verify your email address' },
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
  const [role, setRole] = useState<'User' | 'Analyst' | 'Admin'>('User');

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const step1Valid = (() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!email || !/\S+@\S+\.\S+/.test(email)) return false;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  })();

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

  const step2Valid = !!department && !!role;

  const handleStep2Continue = async () => {
    setLoading(true);
    try {
      const result = await authApi.register({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      });
      setRegisteredUserId(result.userId);
      // OTP (server-side)
      addToast({ type: 'info', title: 'OTP sent', message: `A verification code has been sent to ${email}` });
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      addToast({ type: 'error', title: 'Registration failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 5) { setOtpError('Please enter the full 5-digit code.'); return; }
    setLoading(true); setOtpError('');
    try {
      await authApi.verifyOtp(registeredUserId, otp);
      addToast({ type: 'success', title: 'Email verified!', message: 'Your account is ready. Please log in.' });
      onNavigate('/login');
    } catch {
      setOtpError('Incorrect code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtp(''); setOtpError('');
    addToast({ type: 'info', title: 'Code resent', message: `A new code has been sent to ${email}` });
  };

    const rightPanel = (
    <div style={{ width: '100%', maxWidth: 410 }}>
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

          <Button fullWidth size="lg" onClick={handleStep1Continue} disabled={!step1Valid} style={{ width: '100%', padding: '13px 20px', fontSize: 13,
                          fontWeight: 700, borderRadius: 8, }}>
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

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Role
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: role === r ? 700 : 400,
                    border: `1.5px solid ${role === r ? 'var(--color-primary)' : 'var(--border)'}`,
                    background: role === r ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    color: role === r ? 'var(--color-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={() => setStep(1)}
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

      {/* Step 3 — OTP */}
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
            Confirm your email
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, lineHeight: 1.6, fontFamily: 'Inter, system-ui, sans-serif' }}>
            We sent a 5-digit verification code to
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {email}
          </p>

          <div style={{ marginBottom: otpError ? 8 : 20 }}>
            <OtpInput value={otp} onChange={setOtp} length={5} />
          </div>

          {otpError && (
            <p style={{ fontSize: 12, color: 'var(--color-danger)', textAlign: 'center', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {otpError}
            </p>
          )}

          <Button fullWidth loading={loading} onClick={() => { void handleOtpSubmit(); }} 
            style={{ width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8 }}
            disabled={otp.length < 5}>
            Verify &amp; Go to Login
          </Button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={handleResendOtp}
              style={{
                background: 'none', border: 'none', color: 'var(--color-primary)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Didn't receive a code? Resend
            </button>
          </div>

          <p style={{
            textAlign: 'center', marginTop: 10, fontSize: 11,
            color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            After verification you'll be redirected to login.
          </p>
        </>
      )}
    </div>
  );

  return (
    <AuthLayout
      leftContent={<StepSidebar step={step} />}
      rightContent={rightPanel}
      onLogoClick={() => onNavigate('/')}
    />
  );
}
