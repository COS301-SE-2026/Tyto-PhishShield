import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/auth-layout';
import { Button } from '../../components/ui';
import { API_BASE } from '../../services/api';
import { TriangleAlert } from 'lucide-react';

interface LinkClickedProps { readonly onNavigate: (path: string) => void; }

type Status = 'checking' | 'recorded' | 'invalid' | 'error';

async function reportLinkClicked(token: string): Promise<Status> {
  try {
    const res = await fetch(`${API_BASE}/xp/link-clicked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.status === 404) return 'invalid';
    if (!res.ok) return 'error';
    return 'recorded';
  } catch {
    return 'error';
  }
}

function LeftPanel() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <TriangleAlert size={30} color="#F59E0B" aria-hidden="true" />
      </div>
      <h2 style={{ color: '#fff', fontSize: 21, fontWeight: 700, marginBottom: 8, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        This was a phishing simulation
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 280 }}>
        Tyto PhishShield sent this test to help build your organisation's security awareness.
      </p>
    </div>
  );
}

export function LinkClicked({ onNavigate }: LinkClickedProps) {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async (): Promise<void> => {
      if (!token) {
        if (!cancelled) setStatus('invalid');
        return;
      }
      const result = await reportLinkClicked(token);
      if (!cancelled) setStatus(result);
    };

    void check();
    return () => { cancelled = true; };
  }, [token]);

  const rightPanel = (
    <div style={{
      width: '100%', maxWidth: 460, background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: '36px 34px', textAlign: 'center',
    }}>
      {status === 'checking' && (
        <>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Checking your link…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === 'recorded' && (
        <>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--color-warning-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
          }}>
            <TriangleAlert size={24} color="var(--color-warning)" aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
            You clicked a simulated phishing link
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
            This link was part of a phishing awareness test run by your organisation, no real harm was done.
            As a result, <strong>40 XP</strong> has been deducted from your account and new training has been assigned to help you spot the warning signs next time.
          </p>
          <Button fullWidth size="lg" onClick={() => onNavigate('/login')}
            style={{ width: '100%', padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
            Log in to Tyto PhishShield
          </Button>
        </>
      )}

      {status === 'invalid' && (
        <>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
            This link isn't valid
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
            We couldn't find a matching phishing simulation for this link, it may have expired. If you feel this is a mistake, please log in and contact your administrator.
          </p>
          <Button fullWidth size="lg" onClick={() => onNavigate('/login')}
            style={{ width: '100%', padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
            Log in to Tyto PhishShield
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
            We couldn't confirm this link right now. If you clicked a link from a Tyto PhishShield training email, please log in for more information.
          </p>
          <Button fullWidth size="lg" onClick={() => onNavigate('/login')}
            style={{ width: '100%', padding: '13px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
            Log in to Tyto PhishShield
          </Button>
        </>
      )}
    </div>
  );

  return (
    <AuthLayout leftContent={<LeftPanel />} rightContent={rightPanel} onLogoClick={() => onNavigate('/')} />
  );
}