const spacingScale = [8, 16, 24, 32, 48];

function SpacingSection() {
    return(
        <div>

            <p 
                style={{
                    maxWidth: 720,
                    marginBottom: 24,
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    lineHeight: 1.5,
                }}
            >
                The interface makes use of an 8px spacing grid where possible. Smaller 4px increments are also allowed.
            </p>

            <div
                style={{
                    display: 'grid',
                    gap: 12,
                }}
            >
                {spacingScale.map((spacing) => (
                    <div 
                        key={spacing} 
                        style={{
                            padding: 16,
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--bg-input)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >

                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                alignItems: 'center',
                            }}
                        >

                            <div 
                                style={{
                                    width: 52,
                                    flexShrink: 0,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {spacing}px
                            </div>

                            <div
                                style={{ 
                                    width: `${spacing * 6}px`,
                                    maxWidth: 'calc(100% - 72px)',
                                    height: 18,
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-primary)',
                                }}
                            />

                        </div>

                        <p 
                            style={{
                                marginTop: 12,
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                            }}
                        >
                            Equivalent Tailwind class:{' '}
                            <span 
                                style={{
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}
                            > p-{spacing / 4}</span>
                        </p>

                    </div>
                ))}
            </div>
        </div>
    );
}

export default SpacingSection;