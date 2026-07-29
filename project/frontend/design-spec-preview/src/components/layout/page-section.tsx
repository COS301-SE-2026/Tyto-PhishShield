import React from 'react';

type PageSectionProps = {
    id: string;
    title: string;
    darkMode: boolean;
    children: React.ReactNode;
}

function PageSection({id, title, darkMode, children }: PageSectionProps) {
    const sectionStyle = darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-50'

    return (
        <section
            id={id}
            className={`rounded-2xl border p-6 shadow-sm ${sectionStyle}`}
        >
            <h2 className='mb-10 text-4x1 font-bold'>
                {title}
            </h2>

            {children}
        </section>
    )
}

export default PageSection;