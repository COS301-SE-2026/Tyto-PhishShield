import type { ReactNode } from "react";

type PageSectionProps = {
    id: string;
    title: string;
    children: ReactNode;
}

function PageSection({id, title, children }: PageSectionProps) {
    return (
        <section
            id={id}
            style={{
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)',
                scrollMarginTop: 24,
                padding: 16,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
            }}
        >
            <h2 
                style={{
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.5
                }}
            >
                {title}
            </h2>

            {children}
        </section>
    )
}

export default PageSection;