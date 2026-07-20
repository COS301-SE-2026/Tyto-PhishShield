import React, { type ReactNode } from 'react';
import { LogoLockup } from '../ui/owl-logo';
import { ThemeToggle } from '../ui';
import { useTheme } from '../../context/theme-context';

interface AuthLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  onLogoClick?: () => void;
}

export function AuthLayout({ leftContent, rightContent, onLogoClick }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      background: 'var(--bg-page)',
    }}>
      {/* Left panel — navy brand panel */}
      <div style={{
        width: '42%', minWidth: 340, background: '#0F172A',
        padding: '44px', display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        '@media (max-width: 768px)': { display: 'none' },
      } as React.CSSProperties}>
        <div
          style={{ cursor: 'pointer', marginBottom: 44 }}
          onClick={onLogoClick}
        >
          <LogoLockup size={30} dark />
        </div>
        {leftContent}
      </div>

      {/* Right panel — form area */}
      <div style={{
        flex: 1, background: 'var(--bg-[page])',
        display: 'flex', flexDirection: 'column',
        overflow: 'auto',
      }}>
        {/* Top bar with theme toggle */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        {/* Centred form */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 48px',
        }}>
          {rightContent}
        </div>
      </div>
    </div>
  );
}
