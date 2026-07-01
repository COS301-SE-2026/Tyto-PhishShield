import React, { useState } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { MockDepartmentLeaderboard, MockUserLeaderboard } from "../../data/mock-leaderboard-data";

interface LeaderboardProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

type LeaderboardTab = 'users' | 'departments';

type DepartmentRankMode = 'totalXP' | 'averageXP';

export default function Leaderboard({onNavigate, activePath}: LeaderboardProps) {
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('departments');

    return(
        <AppLayout activePath={activePath} onNavigate={onNavigate} title='Leaderboard' securityScore={72}> 
            <main style={{ background: 'var(--bg-page)', minHeight: '100%', padding: 24 }}>
                <section style={{maxWidth: 1100, margin: '0 auto'}}>
                    <div style={{marginBottom: 24 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Leaderboard
                        </h1>
                        <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                            Track top-performing users and departments
                        </p>
                    </div>

                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 8,
                            gap: 6,
                            display: 'inline-flex',
                            marginBottom: 24,
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <TabButton 
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                        >
                            Users
                        </TabButton>

                        <TabButton 
                            active={activeTab === 'departments'}
                            onClick={() => setActiveTab('departments')}
                        >
                            Departments
                        </TabButton>
                        
                    </div>
                    
                </section>
            </main>
        </AppLayout>
    );
}

function TabButton ({active, onClick, children,} : {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            style={{
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '8px 14px',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
            }}
        >
            {children}
        </button>
    );
}