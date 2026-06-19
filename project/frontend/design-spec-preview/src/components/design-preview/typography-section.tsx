type TypographySectionProps = {
    darkMode : boolean;
};

const typeScale = [
    { label: 'Hero H1', size: '32–50px', className: 'text-4xl md:text-5xl font-extrabold' },
    { label: 'H1', size: '28–32px', className: 'text-3xl font-bold' },
    { label: 'H2', size: '22–24px', className: 'text-2xl font-bold' },
    { label: 'H3', size: '18–20px', className: 'text-xl font-semibold' },
    { label: 'Body', size: '14–16px', className: 'text-base' },
    { label: 'Caption', size: '11–12px', className: 'text-xs' },
    { label: 'Micro Label', size: '10–11px', className: 'text-[11px] uppercase tracking-wide font-semibold' },
];

function TypographySection({darkMode}: TypographySectionProps) {
    const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600';

    return (
        <div className='grid gap-6 lg'>
            <div className='space-y-5'>
                {typeScale.map((item) => (
                    <div key={item.label}>
                        <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${mutedText}`}>
                            {item.label} / {item.size}
                        </p>

                        <p className={item.className}>
                            I tried to go phishing, but I only caught spam.
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TypographySection;