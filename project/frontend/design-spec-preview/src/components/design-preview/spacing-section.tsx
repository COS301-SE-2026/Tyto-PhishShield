type SpacingSectionProps = {
    darkMode : boolean;
};

const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48];

function SpacingSection({darkMode}: SpacingSectionProps) {
    const cardStyle = darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50';

    const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600';

    return(
        <div className='space-y-4'>

            {spacingScale.map((spacing) => (
                <div key={spacing} className={`rounded-xl border p-4 ${cardStyle}`}>

                    <div className="flex items-center gap-6">

                        <div className="w-14 font-semibold">
                            {spacing}px
                        </div>

                        <div
                            className="h-5 rounded bg-blue-600"
                            style={{ width: `${spacing * 8}px` }}
                        />

                    </div>

                    <p className={`mt-3 text-sm ${mutedText}`}>
                        Tailwind class:
                        <span className="font-semibold"> p-{spacing / 4}</span>
                    </p>

                </div>
            ))}

        </div>
    );
}

export default SpacingSection;