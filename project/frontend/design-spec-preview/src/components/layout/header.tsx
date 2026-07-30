import type { Dispatch, SetStateAction } from "react";

type HeaderProps = {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
    onToggleSidebar: () => void;
}

function Header({ darkMode, setDarkMode, onToggleSidebar }: HeaderProps) {
    return (
        <header 
            style={{
                background: 'var(--bg-topbar)',
                height: 60,
                padding: "0 24px",
                borderBottom: '1px solid var(--border)',
                boxShadow: "var(--shadow-sm)",
                display: 'flex',
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
            }}
        >
            <div 
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                }}
            >
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    style={{
                        padding: 8,
                        border: "none",
                        borderRadius: 6,
                        background: "none",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <svg
                        width='18'
                        height='18'
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div>
                    <h1 
                        style={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: 15,
                            lineHeight: 1.5,
                        }}
                    >
                        Design Specification Preview 
                    </h1>
                </div>
            </div>

                {/* Dark Mode button. Need to replace later. Most of the styling and the svg was made with help from AI */}
                <button
                    type="button"
                    onClick={() => setDarkMode(value => !value)}
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    style={{
                    width: 36,
                    height: 36,
                    border: "1.5px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    }}
                >
                    {darkMode ? (
                    <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                    </svg>
                    ) : (
                    <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
                    </svg>
                    )}
                </button>
            
        </header>
    )
}

export default Header;