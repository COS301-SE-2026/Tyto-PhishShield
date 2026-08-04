import type { CSSProperties, ReactNode } from "react";

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' |'neutral';
type ToastType = 'success' | 'warning' | 'error';

const buttonVariants: { label: string; variant: ButtonVariant }[] = [
  { label: "Primary", variant: "primary" },
  { label: "Secondary", variant: "secondary" },
  { label: "Ghost", variant: "ghost" },
  { label: "Danger", variant: "danger" },
];

const badgeVariants: { label: string; variant: BadgeVariant }[] = [
  { label: "Primary", variant: "primary" },
  { label: "Success", variant: "success" },
  { label: "Warning", variant: "warning" },
  { label: "Danger", variant: "danger" },
  { label: "Neutral", variant: "neutral" },
];

function ComponentsSection() {
    const sectionStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap:32,
    };

    const rowStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap:16,
    };
    
    const inputStyle: CSSProperties = {
        width: '100%',
        padding: 12,
        minHeight: 36,
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        outline: "none",
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        fontSize: 12,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    };
    return (
        <div style={sectionStyle}>
            <section>
                <SectionHeading
                    title='Buttons'
                    description='Standard button variants and common button states.'
                />

                <div style={rowStyle}>
                    {buttonVariants.map(button => (
                        <PreviewButton
                            key={button.variant}
                            variant={button.variant}
                        >
                            {button.label}
                        </PreviewButton>
                    ))}
                    <PreviewButton
                        variant='primary' 
                        active
                    >
                        Active
                    </PreviewButton>
                    <PreviewButton
                        variant='primary' 
                        disabled
                    >
                        Disabled
                    </PreviewButton>
                    <PreviewButton
                        variant='primary' 
                        disabled
                    >
                        Loading...
                    </PreviewButton>
                </div>
            </section>

            <section>
                <SectionHeading
                    title='Input'
                    description='Standard text input'
                />

                <div style={{maxWidth: 360 }}>
                    <label 
                        htmlFor="component-input"
                        style={{
                            display: "block",
                            marginBottom: 8,
                            color: "var(--text-primary)",
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        Campaign name
                    </label>

                    <input
                        id='component-input'
                        placeholder="Enter campaign name"
                        style={inputStyle}
                    />
                </div>
            </section>

            <section>
                <SectionHeading
                    title='Badges'
                    description='Badges are used to indicate status, difficulty, outcomes, etc.'
                />

                <div style={rowStyle}>
                        {badgeVariants.map(badge => (
                            <PreviewBadge 
                                key={badge.variant}
                                variant={badge.variant}
                            >
                                {badge.label}
                            </PreviewBadge>
                        ))}
                </div>
            </section>

            <section>
                <SectionHeading
                    title='Toast'
                    description='Toast notifications help provide feedback'
                />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 12,
                    }}
                >
                    <ToastPreview
                        type='success'
                        title='Campaign scheduled'
                        message='Campaign was successfully scheduled.'
                    />
                    <ToastPreview
                        type='warning'
                        title='Attention required'
                        message='Something may need attention.'
                    />
                    <ToastPreview
                        type='error'
                        title='Action failed'
                        message='The request could not be completed.'
                    />
                </div>
            </section>
        </div>
    )
}

function SectionHeading({
    title, 
    description
} : {
    title:string; 
    description: string;
}) {
    return(
        <div style={{
            marginBottom: 16,
        }}>
            <h3
                style={{
                    color: 'var(--text-primary)',
                    fontSize:15,
                    fontWeight: 700,
                }}
            >
                {title}
            </h3>
            <p
                style={{
                    color: 'var(--text-secondary)',
                    fontSize:12,
                    lineHeight: 1.5,
                    marginTop: 4,
                }}
            >
                {description}
            </p>
        </div>
    )
}

function PreviewButton({
    children,
    variant,
    active = false,
    disabled =false,
} : {
    children: ReactNode;
    variant: ButtonVariant;
    active?: boolean;
    disabled?: boolean;
}) {
    const variants = {
        primary: {
            background: "var(--color-primary)",
            color: "#ffffff",
            border: "var(--color-primary)",
        },
        secondary: {
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            border: "var(--color-primary-mid)",
        },
        ghost: {
            background: "transparent",
            color: "var(--color-primary)",
            border: "transparent",
        },
        danger: {
            background: "var(--color-danger)",
            color: "#ffffff",
            border: "var(--color-danger)",
        },
    };

    const selected = variants[variant];

    return(
        <button
            type='button'
            style={{
                padding: '8px 16px',
                border: `1.5px solid ${selected.border}`,
                borderRadius: "var(--radius-md)",
                background: selected.background,
                color: selected.color,
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' :'pointer',
                opacity: disabled ? 0.5 : 1,
                filter: active ? "brightness(0.88)" : "none",
            }}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

function PreviewBadge({
    children,
    variant,
}: {
    children: ReactNode;
    variant: BadgeVariant;
}) {
    const variants = {
        primary: [
            'var(--color-primary-light)',
            'var(--color-primary)',
            'var(--color-primary-mid)',
        ],
        success: [
            'var(--color-success-light)',
            'var(--color-success)',
            'var(--color-success-border)',
        ],
        warning: [
            'var(--color-warning-light)',
            'var(--color-warning)',
            'var(--color-warning-border)',
        ],
        danger: [
            'var(--color-danger-light)',
            'var(--color-danger)',
            'var(--color-danger-border)',
        ],
        neutral: [
            'var(--bg-hover)',
            'var(--text-secondary)',
            'var(--border)',
        ],
    };
    const [background, color, border] = variants[variant];

    return(
        <span
            style={{
                padding: '4px 8px',
                background,
                color,
                fontSize: 10,
                fontWeight: 600,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-full)',
            }}
        >
            {children}
        </span>
    )
}

function ToastPreview({
    title,
    message,
    type,
}: {
    title: string;
    message:string;
    type: ToastType;
}) {
    const variants = {
        success: [
            'var(--color-success-light)',
            'var(--color-success)',
            'var(--color-success-border)',
        ],
        warning: [
            'var(--color-warning-light)',
            'var(--color-warning)',
            'var(--color-warning-border)',
        ],
        error: [
            'var(--color-danger-light)',
            'var(--color-danger)',
            'var(--color-danger-border)',
        ],
    };
    const [background, color, border] = variants[type];

    return(
        <div
            style={{
                padding: 16,
                background,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <p
                style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color,
                }}
            >
                {title}
            </p>
            <p
                style={{
                    marginTop: 4,
                    fontSize: 11,
                    lineHeight:1.5,
                    color:'var(--text-secondary)',
                }}
            >
                {message}
            </p>
        </div>
    )
}

export default ComponentsSection;