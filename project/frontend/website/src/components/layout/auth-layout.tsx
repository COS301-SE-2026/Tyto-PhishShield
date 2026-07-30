import React, { type ReactNode } from 'react';
import { LogoLockup } from '../ui/owl-logo';
import { ThemeToggle } from '../ui';
import { useTheme } from '../../context/theme-context';

interface AuthLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  onLogoClick?: () => void;
  onHelpClick?: () => void;
}

export function AuthLayout({ leftContent, rightContent, onLogoClick, onHelpClick }: AuthLayoutProps) {
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
        {/* Top bar with help + theme toggle */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {onHelpClick && (
            <button type="button"
              onClick={onHelpClick}
              aria-label="Help Centre"
              title="Help Centre"
              style={{
                background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 500, lineHeight: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>?</span>
            </button>
          )}
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
