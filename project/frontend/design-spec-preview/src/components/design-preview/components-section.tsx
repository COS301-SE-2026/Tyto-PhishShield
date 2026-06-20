type ComponentsSectionProps = {
    darkMode : boolean;
};

type MetricCardProps = {
    title: string;
    value: string;
    note: string;
    darkMode: boolean;
}

function ComponentsSection({darkMode}: ComponentsSectionProps) {
    return (
        <div>
            {/* buttons */}
            <div className='flex flex-wrap gap-4'>
                <button className='rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200'>
                    Primary
                </button>
                <button className='rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-500 transition hover:bg-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-200'>
                    Secondary
                </button>
                <button className='rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200'>
                    Danger
                </button>
                <button className='rounded-lg px-4 py-2 font-semibold text-blue-500 transition hover:bg-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-200'>
                    Ghost
                </button>
                <button className='cursor-not-allowed rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white opacity-50'>
                    Disabled
                </button>
            </div>

            {/* cards */}
            <div className='mt-8 grid gap-4 md:grid-cols-3'>
                <MetricCard
                    title='Reported Emails'
                    value='420'
                    note='+100 this week'
                    darkMode={darkMode}
                />

                <MetricCard
                    title='Threats Detected'
                    value='67'
                    note='High Accuracy'
                    darkMode={darkMode}
                />

                <MetricCard
                    title='Training XP'
                    value='10101'
                    note='+500 compared to last week'
                    darkMode={darkMode}
                />
            </div>
        </div>
    )
}

function MetricCard({title, value, note, darkMode}: MetricCardProps){
    const cardStyle = darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100';

    const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600';

    return(
        <article className={`rounded-2xl border p-6 shadow-sm ${cardStyle}`}>
            <p className={`text-sm font-medium ${mutedText}`}>
                {title}
            </p>

            <h3 className="mt-3 text-4xl font-extrabold">
                {value}
            </h3>

            <p className={`mt-2 text-sm ${mutedText}`}>
                {note}
            </p>
        </article>
    )
}

export default ComponentsSection;