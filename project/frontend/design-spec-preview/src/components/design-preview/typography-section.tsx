const typeScale = [
    { label: 'Hero H1', size: '32-50px', fontSize: 46, fontWeight: 800 },
    { label: 'H1', size: '28-32px', fontSize: 30, fontWeight: 700 },
    { label: 'H2', size: '22-24px', fontSize: 24, fontWeight: 700 },
    { label: 'H3', size: '18-20px', fontSize: 20, fontWeight: 600 },
    { label: 'Body', size: '14-16px', fontSize: 15, fontWeight: 400 },
    { label: 'Caption', size: '11-12px', fontSize: 12, fontWeight: 400 },
];

function TypographySection() {
    return (
        <div 
            style={{
                display: 'grid',
                gap: 32,
            }}
        >
            <section>
                <h3
                    style={{
                        color: 'var(--color-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 12,
                    }}
                >
                    Font Family
                </h3>

                <div
                    style={{
                        padding: 16,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input)',
                        borderRadius:'var(--radius-lg)',
                    }}
                >
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                        }}
                    >
                        font-family: "Inter", system-ui, -apple-system, sans-serif;
                    </p>
                    <p
                        style={{
                            color: 'var(--text-muted)',
                            fontSize: 12,
                            marginTop:12,
                        }}
                    >
                        Primary font loaded from Google Fonts with system-ui and -apple-system fallbacks.
                    </p>
                </div>
            </section>

            <section>
                <h3
                    style={{
                        color: 'var(--color-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 16,
                    }}
                >
                    Typography Scale
                </h3>
            
                <div 
                    style={{
                        gap:24,
                        display: 'grid',
                    }}
                >
                    {typeScale.map((item) => (
                        <div key={item.label}>
                            <div
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em'
                                }}
                            >
                                {item.label} / {item.size}
                            </div>

                            <div
                                style={{
                                    color: 'var(--text-primary)',
                                    fontSize: item.fontSize,
                                    fontWeight: item.fontWeight,
                                    lineHeight: 1.5
                                }}
                            >
                                I tried to go phishing, but I only caught spam.
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default TypographySection;