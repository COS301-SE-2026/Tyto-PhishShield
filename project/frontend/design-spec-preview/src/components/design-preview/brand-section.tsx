function BrandSection() {
    return(
        <div 
            style={{
                maxWidth: 760,
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--text-primary)'
            }}
        >
            <p
                style={{
                    maxWidth: 720,
                    color: 'var(--text-secondary)'
                }}
            >
                Tyto-PhishShield helps organizations to build resilience against phishing attacks by training employees with realistic phishing simulations.
            </p>
            
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 32,
                    marginTop: 24,
                }}
            >
                <div>
                    <h3
                        style={{
                            color: 'var(--color-primary)',
                            marginTop: 8,
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Mission
                    </h3>
                    <p 
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                            lineHeight: 1.5,
                        }}
                    >
                        Make employees a part of the firewall by encouraging safer
                        behaviour and faster phishing reporting.
                    </p>
                </div>

                <div>
                    <h3
                        style={{
                            color: 'var(--color-primary)',
                            marginTop: 8,
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Tone
                    </h3>
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                            lineHeight: 1.5,
                        }}
                    >
                        Clear, Helpful, Encouraging, Security-focused and Professional
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BrandSection;