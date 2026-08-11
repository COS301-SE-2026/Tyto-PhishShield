import { useState } from 'react';
import { LogoLockup } from '../components/ui/owl-logo';
import { ThemeToggle, Card, Input, Button } from '../components/ui';
import { useTheme } from '../context/theme-context';
import { useToast } from '../context/toast-context';
import { Mail, Trophy, ShieldCheck, BarChart3, Building2, Check } from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
}


const SALES_EMAIL = 'cos301.fiveguys@gmail.com';
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const COMPANY_BENEFITS = [
  'A dedicated instance for your organisation - your own users, departments, and admins.',
  'AI-generated phishing simulations tailored to your industry and threat landscape.',
  'Native Outlook add-in so employees can report suspicious emails in one click.',
  'Real-time analytics and gamified training to track security culture over time.',
];

interface CompanyContactForm {
  companyName: string;
  workEmail: string;
  message: string;
}

interface CompanyContactErrors {
  companyName?: string;
  workEmail?: string;
}

function CompanyContactSection() {
  const { addToast } = useToast();
  const [form, setForm] = useState<CompanyContactForm>({ companyName: '', workEmail: '', message: '' });
  const [errors, setErrors] = useState<CompanyContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const setField = (field: keyof CompanyContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors: CompanyContactErrors = {};
    if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.';
    if (!form.workEmail.trim()) nextErrors.workEmail = 'Work email is required.';
    else if (!EMAIL_PATTERN.test(form.workEmail.trim())) nextErrors.workEmail = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
    addToast({ type: 'success', title: 'Message sent', message: 'Thanks - our team will be contacting you shortly.' });
  };

  if (!expanded) {
    return (
      <section style={{ padding: '80px 48px', maxWidth: 700, margin: '0 auto', width: '100%', flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '1px', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
          FOR OTHER ORGANISATIONS
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Bring PhishShield to your company
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 26, fontFamily: 'Inter, system-ui, sans-serif' }}>
          PhishShield isn&apos;t limited to Tyto — we can stand up a dedicated deployment for your organisation too.
        </p>
        <Button onClick={() => setExpanded(true)}>Learn more</Button>
      </section>
    );
  }

  return (
    <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto', width: '100%', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '1px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              FOR OTHER ORGANISATIONS
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Show less
            </button>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Bring PhishShield to your company
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 22, fontFamily: 'Inter, system-ui, sans-serif' }}>
            PhishShield is not limited to Tyto. We can stand up a dedicated deployment for your
            organisation, so your team gets the same simulated phishing training, analytics, and
            gamified learning shown above.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {COMPANY_BENEFITS.map(b => (
              <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <Check size={11} strokeWidth={3} color="var(--color-primary)" aria-hidden="true" />
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'Inter, system-ui, sans-serif' }}>{b}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={15} color="var(--text-muted)" aria-hidden="true" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Prefer email? Reach us directly at{' '}
              <a href={`mailto:${SALES_EMAIL}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{SALES_EMAIL}</a>
            </span>
          </div>
        </div>

        <Card style={{ padding: '28px 26px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--color-success-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <Check size={20} color="var(--color-success)" strokeWidth={3} aria-hidden="true" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>
                Thanks for reaching out
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                We have received your message and will be in touch shortly.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, background: 'var(--color-primary-light)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={17} color="var(--color-primary)" aria-hidden="true" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Get in touch
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  label="Company name" placeholder="e.g. Acme Corp" required
                  value={form.companyName} error={errors.companyName}
                  onChange={e => setField('companyName', e.target.value)}
                />
                <Input
                  label="Work email" placeholder="you@company.com" type="email" required
                  value={form.workEmail} error={errors.workEmail}
                  onChange={e => setField('workEmail', e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Message (optional)</label>
                  <textarea
                    rows={3} placeholder="Tell us a bit about your organisation and needs."
                    value={form.message}
                    onChange={e => setField('message', e.target.value)}
                    style={{
                      width: '100%', border: '1.5px solid var(--border-strong, var(--border))', borderRadius: 'var(--radius-md)',
                      padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-input)',
                      outline: 'none', resize: 'vertical', fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                </div>
                <Button loading={submitting} disabled={submitting} onClick={() => { void handleSubmit(); }} fullWidth>
                  Send message
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Simulated Phishing',
    desc: 'Safe, AI-generated phishing waves using GPT-4 and Llama-3 that mirror real-world attacks closely.',
    icon: ShieldCheck,
  },
  {
    title: 'Live Analytics',
    desc: 'Real-time dashboards tracking detection rates, click behaviour, and organisational trends.',
    icon: BarChart3,
  },
  {
    title: 'Gamified Learning',
    desc: 'XP points, badges, and leaderboards that drive engagement and long-term retention.',
    icon: Trophy,
  },
  {
    title: 'Outlook Add-in',
    desc: 'Native Report Phish button in Outlook across desktop, web, and mobile via Office.js.',
    icon: Mail,
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
            onClick={() => onNavigate('/help')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500,
              padding: '7px 12px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
          >
            Help
          </button>
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
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return(
              <div key={f.title} style={{
                background: 'var(--bg-card)', 
                borderRadius: 14, 
                padding: '28px 22px',
                border: '1px solid var(--border)', 
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget).style.transform = 'translateY(-2px)';
                (e.currentTarget).style.boxShadow = '0 8px 24px rgba(37,99,235,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget).style.transform = 'none';
                (e.currentTarget).style.boxShadow = 'var(--shadow-sm)';
              }}
              >
                <div style={{
                  width: 42, height: 42, background: 'var(--color-primary-light)',
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 16,
                }}>
                  <Icon
                    size={20}
                    strokeWidth={2}
                    color='var(--color-primary)'
                    aria-hidden='true'
                  />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 7, fontFamily: 'Inter, system-ui, sans-serif' }}>{f.title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'Inter, system-ui, sans-serif' }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#0F172A', padding: '80px 48px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '1px', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>HOW IT WORKS</div>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>Three steps from wave to insight</h2>
        <p style={{ color: 'rgba(255,255,255,0.38)', marginBottom: 52, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>From admin launch to employee learning in minutes.</p>
        <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 860, margin: '0 auto', flexWrap: 'wrap', gap: 0 }}>
          {[
            { n: '1', title: 'Admin launches wave', desc: 'Configure target group, AI model, and phishing template. Schedule and deploy.' },
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

      <CompanyContactSection />

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
