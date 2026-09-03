export function OwlLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-label="PhishShield logo">
      <circle cx="18" cy="18" r="17" fill="#0F172A" stroke="#2563EB" strokeWidth="1.5"/>
      <ellipse cx="18" cy="21" rx="7" ry="8" fill="#2563EB"/>
      <ellipse cx="18" cy="13" rx="6" ry="5.5" fill="#2563EB"/>
      <path d="M13 9.5L14.5 7L16 10" fill="#2563EB"/>
      <path d="M23 9.5L21.5 7L20 10" fill="#2563EB"/>
      <ellipse cx="18" cy="13.5" rx="4.5" ry="4" fill="#0F172A"/>
      <circle cx="15.8" cy="13" r="1.8" fill="#fff"/>
      <circle cx="20.2" cy="13" r="1.8" fill="#fff"/>
      <circle cx="15.8" cy="13" r="0.9" fill="#0F172A"/>
      <circle cx="20.2" cy="13" r="0.9" fill="#0F172A"/>
      <path d="M17.2 15.5L18 16.8L18.8 15.5Z" fill="#F59E0B"/>
      <path d="M15.5 22l1.8 1.8 3.2-3.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function LogoLockup({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <OwlLogo size={size} />
      <div>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700, fontSize: size * 0.53,
          color: dark ? '#fff' : 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.3px',
        }}>
          PhishShield
        </div>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500, fontSize: size * 0.28,
          color: dark ? 'var(--sidebar-text)' : 'var(--text-muted)',
          letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.4,
        }}>
          by Tyto
        </div>
      </div>
    </div>
  );
}
