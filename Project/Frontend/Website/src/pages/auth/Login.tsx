import React, { useState } from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input, PasswordInput, Button, Modal, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';

interface LoginProps {
  onNavigate: (path: string) => void;
}

function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setSent(false); setEmail(''); setError(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset your password">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--color-success-light)', border: '2px solid var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            We've sent password reset instructions to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
          </p>
          <Button fullWidth onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
          <Input
            label="Email address"
            type="email"
            placeholder="you@tyto.co.za"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            error={error}
            required
            style={{ marginBottom: 20 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={handleClose} style={{ flex: 1 }}>Cancel</Button>
            <Button fullWidth loading={loading} onClick={handleSubmit} style={{ flex: 1 }}>
              Send reset link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function Login({ onNavigate }: LoginProps) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [forgotOpen, setForgotOpen] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Welcome back!' });
      onNavigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <h2 style={{
        color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.3,
        marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        Protect your organisation from modern phishing threats
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, marginBottom: 32, fontFamily: 'Inter, system-ui, sans-serif' }}>
        AI-generated simulations. Instant feedback. Real resilience.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { val: '94%', lbl: 'Detection rate' },
          { val: 'GPT-4', lbl: 'AI engine' },
          { val: 'RBAC', lbl: 'Role-based access' },
          { val: 'POPIA', lbl: 'Compliant' },
        ].map(s => (
          <div key={s.val} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ color: '#60A5FA', fontSize: 20, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</div>
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const rightPanel = (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
        Welcome back
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28, fontFamily: 'Inter, system-ui, sans-serif' }}>
        Sign in to your PhishShield account
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div style={{
            background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
            color: 'var(--color-danger)', fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {errors.general}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <Input
            label="Email address"
            type="email"
            placeholder="you@tyto.co.za"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
            error={errors.email}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
            error={errors.password}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign In
        </Button>
      </form>

      <p style={{
        textAlign: 'center', marginTop: 24, fontSize: 12,
        color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        Don't have an account?{' '}
        <button
          onClick={() => onNavigate('/register')}
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Register
        </button>
      </p>

      <p style={{
        textAlign: 'center', marginTop: 12, fontSize: 11,
        color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.5,
      }}>
        New accounts are provisioned by your organisation administrator.<br />
        Contact <a href="mailto:admin@tyto.co.za" style={{ color: 'var(--color-primary)' }}>admin@tyto.co.za</a> for access.
      </p>
    </div>
  );

  return (
    <>
      <AuthLayout
        leftContent={leftPanel}
        rightContent={rightPanel}
        onLogoClick={() => onNavigate('/')}
      />
      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
