import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { Eye, EyeOff, X, Moon, Sun, } from 'lucide-react';

// Button

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

// const buttonStyles: Record<string, string> = {
//   primary:   'bg-primary text-white border-transparent hover:bg-primary-hover',
//   secondary: 'bg-transparent text-primary border-primary hover:bg-primary-light',
//   danger:    'bg-danger text-white border-transparent hover:opacity-90',
//   ghost:     'bg-transparent text-secondary border-transparent hover:bg-hover',
//   outline:   'bg-transparent text-primary-text border-border hover:bg-hover',
// };

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-md',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg',
  lg: 'px-6 py-3 text-base font-bold rounded-lg',
};

export function Button({
  variant = 'primary', size = 'md', loading, icon, fullWidth,
  children, disabled, className = '', ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2 border transition-all duration-150 select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
    sizeStyles[size],
    className,
  ].join(' ');

  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={base}
      style={{
        background: variant === 'primary' ? 'var(--color-primary)' :
                    variant === 'danger'  ? 'var(--color-danger)' : 'transparent',
        color: ['primary','danger'].includes(variant) ? '#fff' :
               variant === 'secondary' ? 'var(--color-primary)' : 'var(--text-secondary)',
        border: `1.5px solid ${
          variant === 'secondary' ? 'var(--color-primary)' :
          variant === 'outline'   ? 'var(--border)' : 'transparent'
        }`,
        borderRadius: size === 'sm' ? 'var(--radius-sm)' : 'var(--radius-md)',
        fontFamily: 'Inter, system-ui, sans-serif',
        ...props.style,
      }}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

// Input

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label, error, hint, leftIcon, rightIcon, ...props
}: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
          {props.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{
            position: 'absolute', left: 11, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>{leftIcon}</span>
        )}
        <input
          {...props}
          style={{
            width: '100%',
            border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--border-strong, var(--border))'}`,
            borderRadius: 'var(--radius-md)',
            padding: `9px ${rightIcon ? '36px' : '12px'} 9px ${leftIcon ? '36px' : '12px'}`,
            fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--bg-input)',
            outline: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            ...props.style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
            props.onFocus?.(e);
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
        />
        {rightIcon && (
          <span style={{
            position: 'absolute', right: 11, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>{rightIcon}</span>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

// PasswordInput

type PasswordInputProps = Omit<InputProps, 'type'>;

export function PasswordInput(props: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOff size={16} aria-hidden='true' />
          ) : (
            <Eye size={16} aria-hidden='true' />
          )}
        </button>
      }
    />
  );
}

// Select

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>}
      <select
        {...props}
        style={{
          width: '100%', border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--border-strong, var(--border))'}`,
          borderRadius: 'var(--radius-md)', padding: '9px 12px', fontSize: 13,
          color: 'var(--text-primary)', background: 'var(--bg-input)',
          fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
          ...props.style,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p style={{ fontSize: 11, color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

// Badge

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const BADGE_COLORS: Record<BadgeVariant, [string, string]> = {
  primary: ['var(--color-primary-light)', 'var(--color-primary)'],
  success: ['var(--color-success-light)', 'var(--color-success)'],
  warning: ['var(--color-warning-light)', 'var(--color-warning)'],
  danger:  ['var(--color-danger-light)',  'var(--color-danger)'],
  neutral: ['var(--bg-hover)',            'var(--text-secondary)'],
};

export function Badge({ children, variant = 'primary' }: { children: ReactNode; variant?: BadgeVariant }) {
  const [bg, fg] = BADGE_COLORS[variant];
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11, fontWeight: 600,
      padding: '2px 9px', borderRadius: 'var(--radius-full)', letterSpacing: '0.2px',
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// Card

export function Card({
  children, style, onClick,
}: { children: ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Modal

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 440 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
          width: '100%', maxWidth, padding: '28px 28px 24px',
          animation: 'modalIn 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex',
            }}
            aria-label='Close'
          >
            <X size={18} aria-hidden='true' />
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(-8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// Spinner

export function Spinner({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color ?? 'currentColor'} strokeWidth="2.5"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// Divider

export function Divider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {label && <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ThemeToggle

export function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-md)', width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
      }}
    >
      {theme === 'light' ? (
        <Moon size={16} aria-hidden='true' />
      ) : (
        <Sun size={16} aria-hidden='true' />
      )}
    </button>
  );
}

// OTP Input

export function OtpInput({ value, onChange, length = 5 }: {
  value: string; onChange: (v: string) => void; length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const arr = value.split('');
    arr[i] = clean;
    const next = arr.join('').slice(0, length);
    onChange(next.padEnd(i + (clean ? 1 : 0), '').slice(0, length));
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length }).map((_, i) => (
        <input
        // eslint-disable-next-line react-x/no-array-index-key -- fixed-length digit slots, never reordered
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          style={{
            width: 52, height: 60, textAlign: 'center', fontSize: 22, fontWeight: 700,
            border: `2px solid ${value[i] ? 'var(--color-primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', background: 'var(--bg-input)',
            color: 'var(--text-primary)', outline: 'none',
            fontFamily: 'Inter, monospace',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = value[i] ? 'var(--color-primary)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

// ToastContainer

export function ToastContainer({ toasts, onRemove }: {
  toasts: { id: string; type: string; title: string; message?: string }[];
  onRemove: (id: string) => void;
}) {
  const bg: Record<string, string> = {
    success: 'var(--color-success)',
    error:   'var(--color-danger)',
    warning: 'var(--color-warning)',
    info:    'var(--color-primary)',
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2000, maxWidth: 320 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderLeft: `4px solid ${bg[t.type] ?? bg.info}`,
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          animation: 'slideIn 0.2s ease-out',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
            {t.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{t.message}</div>}
          </div>
          <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label='Dismiss notification'>
            <X size={14} aria-hidden='true' />
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

// XP Animation Overlay

export function XpAnimationOverlay({ delta, onDone }: { delta: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  const positive = delta >= 0;
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      pointerEvents: 'none',
    }}>
      <div style={{
        textAlign: 'center', animation: 'xpPop 2.5s ease-out forwards',
      }}>
        <div style={{
          fontSize: 48, fontWeight: 800, color: positive ? 'var(--color-success)' : 'var(--color-danger)',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {positive ? '+' : ''}{delta} XP
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginTop: 8, opacity: 0.9 }}>
          {positive ? 'Great job! Keep it up!' : 'Keep practising — you\'ll get there!'}
        </div>
      </div>
      <style>{`
        @keyframes xpPop {
          0%   { opacity:0; transform:scale(0.5) translateY(20px); }
          20%  { opacity:1; transform:scale(1.1) translateY(-10px); }
          40%  { transform:scale(1) translateY(0); }
          70%  { opacity:1; }
          100% { opacity:0; transform:translateY(-30px); }
        }
      `}</style>
    </div>
  );
}
