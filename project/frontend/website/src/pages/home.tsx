import { LogoLockup } from '../components/ui/owl-logo';
import { ThemeToggle } from '../components/ui';
import { useTheme } from '../context/theme-context';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const FEATURES = [
  {
    title: 'Simulated Phishing',
    desc: 'Safe, AI-generated campaigns using GPT-4 and Llama-3 that mirror real-world attacks closely.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  },
  {
    title: 'Live Analytics',
    desc: 'Real-time dashboards tracking detection rates, click behaviour, and organisational trends.',
    icon: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
  },
  {
    title: 'Gamified Learning',
    desc: 'XP points, badges, and leaderboards that drive engagement and long-term retention.',
    icon: <><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></>,
  },
  {
    title: 'Outlook Add-in',
    desc: 'Native Report Phish button in Outlook across desktop, web, and mobile via Office.js.',
    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  },
];

export function Home({ onNavigate }: HomeProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: '#0F172A', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px', height: 66,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 0 rgba(255,255,255,0.07)',
      }}>
        <button onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <LogoLockup size={30} dark />
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            onClick={() => onNavigate('/login')}
            style={{
              background: 'none', border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 13, fontWeight: 500, padding: '7px 20px',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('/register')}
            style={{
              background: '#2563EB', border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 700, padding: '7px 20px',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)',
        padding: '90px 48px 72px', textAlign: 'center', flexShrink: 0,
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
          color: '#93C5FD', fontSize: 11, fontWeight: 600, padding: '5px 14px',
          borderRadius: 9999, letterSpacing: '0.6px', marginBottom: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          AI-POWERED PHISHING SIMULATION
        </div>

        <h1 style={{
          color: '#fff', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 18,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Turn Your Team Into a<br />
          <span style={{ color: '#60A5FA' }}>Human Firewall</span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.62)', fontSize: 17, maxWidth: 540,
          margin: '0 auto 36px', lineHeight: 1.7,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Realistic AI-generated phishing simulations delivered through Outlook.
          Instant teachable moments. Gamified training that sticks.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 64 }}>
          <button
            onClick={() => onNavigate('/register')}
            style={{
              background: '#2563EB', color: '#fff', border: 'none',
              padding: '14px 34px', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Get Started
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 44,
          flexWrap: 'wrap', gap: 0,
        }}>
          {[
            { val: '94%', lbl: 'Detection rate' },
            { val: '3.2×', lbl: 'Faster response' },
            { val: '<500ms', lbl: 'Feedback latency' },
          ].map((s, i, arr) => (
            <div key={i} style={{
              padding: '0 48px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto', width: '100%', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '1px', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
            PLATFORM CAPABILITIES
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>
            A complete security awareness platform
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Built for organisations that take phishing threats seriously.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 14, padding: '28px 22px',
              border: '1px solid var(--border)', transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'none';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
            >
              <div style={{
                width: 42, height: 42, background: 'var(--color-primary-light)',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 7, fontFamily: 'Inter, system-ui, sans-serif' }}>{f.title}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'Inter, system-ui, sans-serif' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#0F172A', padding: '80px 48px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '1px', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>HOW IT WORKS</div>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>Three steps from campaign to insight</h2>
        <p style={{ color: 'rgba(255,255,255,0.38)', marginBottom: 52, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>From admin launch to employee learning in minutes.</p>
        <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 860, margin: '0 auto', flexWrap: 'wrap', gap: 0 }}>
          {[
            { n: '1', title: 'Admin launches campaign', desc: 'Configure target group, AI model, and phishing template. Schedule and deploy.' },
            { n: '2', title: 'Employee receives email', desc: 'AI-generated phishing email lands in Outlook. Employee clicks or reports via add-in.' },
            { n: '3', title: 'Instant teachable moment', desc: 'Immediate feedback highlights specific warning signs. XP awarded for correct reporting.' },
          ].map((s, i, arr) => (
            <div key={i} style={{
              flex: 1, minWidth: 200, padding: '0 32px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', background: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 18, fontWeight: 700, color: '#fff',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>{s.n}</div>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 7, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#2563EB', padding: '64px 48px', textAlign: 'center', flexShrink: 0 }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Ready to strengthen your security posture?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 28, fontSize: 15, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Register to get started with PhishShield at Tyto.
        </p>
        <button
          onClick={() => onNavigate('/register')}
          style={{
            background: '#fff', color: '#2563EB', border: 'none',
            padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Register Now
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0F172A', padding: '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
          &copy; 2025 Tyto &middot; PhishShield
        </div>
        <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, letterSpacing: '0.5px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          COS 301 CAPSTONE &middot; UNIVERSITY OF PRETORIA
        </div>
      </footer>
    </div>
  );
}
