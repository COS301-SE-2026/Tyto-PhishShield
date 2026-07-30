type ColourToken = {
    name: string;
    token: string;
    value: string;
    purpose: string;
};

const colourTokens: ColourToken[] = [
    { name: 'Primary Blue', token:'--color-primary', value: '#2563EB', purpose: 'Primary buttons, links, selected states and focus indicators' },
    { name: 'Primary Blue Hover', token:'--color-primary-hover', value: '#1D4ED8', purpose: 'Hover and pressed states for primary actions' },
    { name: "Structural Navy", token: "--color-navy", value: "#0F172A", purpose: "Sidebar, dark structural elements and primary light-theme text",},
    { name: "Success Green", token: "--color-success", value: "#22C55E", purpose: "Successful actions, completed states and positive indicators",},
    { name: "Warning Amber", token: "--color-warning", value: "#F59E0B", purpose: "Warnings, suspicious activity and caution states", },
    { name: "Danger Red", token: "--color-danger", value: "#EF4444", purpose: "Errors, threats and destructive actions",},
    { name: "Secondary Text", token: "--text-secondary", value: "#64748B", purpose: "Supporting text and metadata",},
    { name: "Page Background", token: "--bg-page", value: "#F8FAFC", purpose: "Main page background in the light theme",},
    { name: "Card Background", token: "--bg-card", value: "#F1F5F9", purpose: "Cards, panels and grouped content",},
    {name: "Dark Card Background", token: "--bg-card", value: "#161B22", purpose: "Cards and panels in the dark theme",},
];

function ColourSection() {
    return(
        <div 
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 16,
            }}
        >
            {colourTokens.map((colour) => (
                <article
                    key={`${colour.name}-${colour.value}`}
                    style={{
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-input)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div
                        style={{ 
                            background: colour.value,
                            height: 72,
                            borderBottom: '1px solid var(--border)',
                        }}
                    />

                    <div 
                        style={{
                            padding: 16,
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: 4,
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            {colour.name}
                        </h3>

                        <p 
                            style={{
                                marginBottom: 4,
                                color: 'var(--color-primary)',
                                fontSize: 11,
                                fontWeight: 500,
                            }}
                        >
                            {colour.token}
                        </p>

                        <p 
                            style={{
                                marginBottom: 8,
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                            }}
                        >
                            {colour.value}
                        </p>

                        <p 
                            style={{
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                lineHeight: 1.5,
                            }}
                        >
                            {colour.purpose}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default ColourSection;