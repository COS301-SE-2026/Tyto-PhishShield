import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Input, PasswordInput } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useTheme } from '../../context/theme-context';
import { useAccessibility } from '../../context/accessibility-context';
import { useToast } from '../../context/toast-context';
import { useNotifications } from '../../context/notification-context';
import { authApi } from '../../services/api';
import { User, Lock, Palette, Accessibility, Bell, Sun, Moon } from 'lucide-react';

interface SettingsProps { onNavigate: (path: string) => void; activePath: string; }

type SettingsTab = 'profile' | 'security' | 'appearance' | 'accessibility' | 'notifications';

export function Settings({ onNavigate, activePath }: SettingsProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, highContrast, setHighContrast, reduceMotion, setReduceMotion, enhancedFocus, setEnhancedFocus, } = useAccessibility();
  const { addToast } = useToast();
  const { preferences: notifPreferences, setPreferences: setNotifPreferences } = useNotifications();

  const [tab, setTab] = useState<SettingsTab>('profile');

  // Profile
  const [name, setName] = useState(user?.email?.split('@')[0] ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    await new Promise(r => setTimeout(r, 700));
    addToast({ type: 'success', title: 'Profile updated' });
    setProfileLoading(false);
  };

  const handleChangePw = async () => {
    setPwError('');
    if (!currentPw) { setPwError('Enter your current password.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      addToast({ type: 'success', title: 'Password changed', message: 'Your password has been updated.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',       label: 'Profile',       icon: <User size={16} /> },
    { id: 'security',      label: 'Security',      icon: <Lock size={16} /> },
    { id: 'appearance',    label: 'Appearance',    icon: <Palette size={16} /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>{desc}</div>}
      </div>
      <button
        role="switch" aria-checked={value} onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? 'var(--color-primary)' : 'var(--border)',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}/>
      </button>
    </div>
  );

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Settings">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,3fr)', gap: 20, alignItems: 'start' }}>

        {/* Tab nav */}
        <Card style={{ padding: '8px 0', overflow: 'hidden' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '11px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: tab === t.id ? 'var(--color-primary-light)' : 'transparent',
              color: tab === t.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.12s',
              borderRight: tab === t.id ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget).style.background = 'transparent'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: tab === t.id ? 'var(--color-primary)' : 'var(--text-muted)' }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </Card>

        {/* Content */}
        <Card style={{ padding: '24px' }}>

          {/* Profile */}
          {tab === 'profile' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Profile Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Display name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@tyto.co.za" />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 5, fontFamily: 'Inter, system-ui, sans-serif' }}>Role</label>
                  <div style={{ padding: '9px 12px', background: 'var(--bg-hover)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {(user?.role ?? 'user').charAt(0).toUpperCase() + (user?.role ?? 'user').slice(1)} — contact your administrator to change
                  </div>
                </div>
                <Button loading={profileLoading} onClick={() => { void handleSaveProfile(); }} 
                  style={{ 
                    alignSelf: 'flex-start',
                    minWidth: 80,
                    }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>Security Settings</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Manage your password and account security.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <PasswordInput label="Current password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                <PasswordInput label="New password" placeholder="Min. 8 characters" value={newPw} onChange={e => { setNewPw(e.target.value); setPwError(''); }} />
                <PasswordInput label="Confirm new password" placeholder="Repeat new password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwError(''); }} error={pwError} />
                <Button loading={pwLoading} onClick={() => { void handleChangePw(); }} 
                  style={{ 
                    alignSelf: 'flex-start',
                    minWidth: 80,
                  }}>
                  Update Password
                </Button>
              </div>
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>Active Sessions</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>You are currently signed in on this device.</p>
                <Button variant="danger" size="sm" onClick={() => addToast({ type: 'warning', title: 'All sessions ended' })}
                  style={{
                    alignSelf: 'flex-start',
                    minWidth: 80,
                  }}>
                  Sign out all devices
                </Button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Appearance</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Theme</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {([
                      ['light', <Sun key="light-icon" size={20}/>],
                      ['dark', <Moon key="dark-icon" size={20}/>],
                    ] as const).map(([t, icon]) => (
                    <button key={t} onClick={() => setTheme(t)} style={{
                      flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${theme === t ? 'var(--color-primary)' : 'var(--border)'}`,
                      background: t === 'light' ? '#F8FAFC' : '#0D1117',
                      transition: 'border-color 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ color: theme === t ? 'var(--color-primary)' : 'var(--text-secondary)', marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t === 'light' ? '#0F172A' : '#F0F6FC', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accessibility */}
          {tab === 'accessibility' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>Accessibility</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
                Adjust the interface to better suit your visual and interaction needs.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>Text size</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['normal','A', 14], ['large','A', 17], ['xl','A', 20]] as const).map(([s, lbl, sz]) => (
                    <button key={s} type="button" onClick={() => setFontSize(s)} style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${fontSize === s ? 'var(--color-primary)' : 'var(--border)'}`,
                      background: fontSize === s ? 'var(--color-primary-light)' : 'var(--bg-hover)',
                      color: fontSize === s ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontWeight: fontSize === s ? 700 : 400,
                      fontFamily: 'Inter, system-ui, sans-serif', fontSize: sz,
                    }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <Toggle value={highContrast} onChange={setHighContrast}
                label="High contrast mode"
                desc="Increases colour contrast for better readability in all conditions." />
              <Toggle value={reduceMotion} onChange={setReduceMotion}
                label="Reduce motion"
                desc="Minimises animations and transitions throughout the interface." />
              <Toggle value={enhancedFocus} onChange={setEnhancedFocus}
                label="Enhanced keyboard focus indicators"
                desc="Makes the focus outline bolder and higher-contrast when navigating by keyboard." />
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--color-primary-light)', borderRadius: 8, border: '1px solid var(--color-primary-mid)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5 }}>
                  PhishShield targets WCAG 2.1 Level AA compliance. If you experience accessibility issues, please contact <a href="mailto:admin@tyto.co.za" style={{ fontWeight: 600 }}>admin@tyto.co.za</a>.
                </p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Notification Preferences</h2>
              
              <Toggle value={notifPreferences.training} onChange={v => setNotifPreferences({ ...notifPreferences, training: v })}
                label="Training reminders"
                desc="Show a notification in the bell when new training is assigned." />
              <Toggle value={notifPreferences.leaderboard} onChange={v => setNotifPreferences({ ...notifPreferences, leaderboard: v })}
                label="Leaderboard updates"
                desc="Show a notification in the bell whenever you gain or lose XP." />
              <Toggle value={notifPreferences.digest} onChange={v => setNotifPreferences({ ...notifPreferences, digest: v })}
                label="Weekly security digest"
                desc="A weekly email summary of your performance and security score — not available yet." />
              <Button onClick={() => addToast({ type: 'success', title: 'Notification preferences saved' })}
                style={{ 
                  marginTop: 20, 
                  alignSelf: 'flex-start',
                  minWidth: 80,
                }}>
                Save Preferences
              </Button>
            </div>
          )}

        </Card>
      </div>
    </AppLayout>
  );
}