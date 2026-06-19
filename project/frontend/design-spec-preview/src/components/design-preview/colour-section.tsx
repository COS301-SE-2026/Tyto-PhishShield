type ColourSectionProps = {
    darkMode : boolean;
};

type ColourToken = {
    name: string;
    value: string;
    purpose: string;
};

const colourTokens: ColourToken[] = [
    { name: 'Primary Navy', value: '#0F172A', purpose: 'Headers, sidebars, hero sections' },
    { name: 'Accent Blue', value: '#2563EB', purpose: 'Buttons, links, focus states' },
    { name: 'Accent Blue Hover', value: '#1D4ED8', purpose: 'Hover states' },
    { name: 'Success Green', value: '#22C55E', purpose: 'XP gains, success states' },
    { name: 'Warning Amber', value: '#F59E0B', purpose: 'Suspicion and warnings' },
    { name: 'Danger Red', value: '#EF4444', purpose: 'Threats and errors' },
    { name: 'Neutral Gray', value: '#64748B', purpose: 'Secondary text' },
    { name: 'Light Blue Accent', value: '#60A5FA', purpose: 'Hero highlights' },
];

function ColourSection({darkMode}: ColourSectionProps) {
    const cardStyle = darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50';

    const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600';

    return(
        <div className = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {colourTokens.map((colour) => (
                <article
                    key={colour.name}
                    className={`rounded-xl border p-4 ${cardStyle}`}
                >
                    <div
                        className="mb-4 h-20 rounded-lg border border-black/10"
                        style={{ backgroundColor: colour.value }}
                    />

                    <h3 className="font-semibold">
                        {colour.name}
                    </h3>

                    <p className={`mt-1 text-sm ${mutedText}`}>
                        {colour.value}
                    </p>

                    <p className={`mt-2 text-sm ${mutedText}`}>
                        {colour.purpose}
                    </p>
                </article>
            ))}
        </div>
    );
}

export default ColourSection;