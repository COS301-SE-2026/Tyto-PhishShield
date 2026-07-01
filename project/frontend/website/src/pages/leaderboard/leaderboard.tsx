import React, { useMemo, useState } from "react";
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
    const [departmentRankMode, setDepartmentRankMode] = useState<DepartmentRankMode>('totalXP');

    const sortedUsers = useMemo( () => [...MockUserLeaderboard].sort((a,b) => b.xp - a.xp), [], );
    const sortedDepartments = useMemo( () => [...MockDepartmentLeaderboard].sort((a,b) => b[departmentRankMode] - a[departmentRankMode]), [departmentRankMode], );

    return(
        <AppLayout activePath={activePath} onNavigate={onNavigate} title='Leaderboard' securityScore={72}> 
            <main style={{ background: 'var(--bg-page)', minHeight: '100%', padding: 24 }}>
                <section style={{maxWidth: 1100, margin: '0 auto'}}>
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
                    
                    {activeTab === 'users' ? (
                        <LeaderboardCard title="User Leaderboard">
                            <LeaderboardTable
                                headers ={['Rank', 'Name', 'Department', 'XP']}
                                rows={sortedUsers.map((user, index) =>[
                                    `#${index + 1}`,
                                    user.name,
                                    user.department,
                                    user.xp.toLocaleString(),
                                ])}
                            />
                        </LeaderboardCard>
                    ) : (
                        <LeaderboardCard
                            title="Departments Leaderboard"
                            action={
                                <div style={{display: 'flex', gap: 6}}>
                                    <TabButton
                                        active={departmentRankMode === 'totalXP'}
                                        onClick={() => setDepartmentRankMode('totalXP')}
                                    >
                                        Total XP
                                    </TabButton>

                                    <TabButton
                                        active={departmentRankMode === 'averageXP'}
                                        onClick={() => setDepartmentRankMode('averageXP')}
                                    >
                                        Average XP
                                    </TabButton>

                                </div>
                            }
                        >
                            <LeaderboardTable
                                headers ={['Rank', 'Department', 'Members', 'Total XP', 'Average XP']}
                                rows={sortedDepartments.map((department, index) =>[
                                    `#${index + 1}`,
                                    department.department,
                                    department.members.toString(),
                                    department.totalXP.toLocaleString(),
                                    department.averageXP.toLocaleString(),
                                ])}
                            />
                        </LeaderboardCard>
                    )}
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

function LeaderboardCard({title, action, children}: {
    title:string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section
            style={{
                background: 'var(--bg-card)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div
                style={{
                    padding: 24,
                    gap: 16,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h2 style={{fontSize: 18, fontWeight: 700}}>
                    {title}
                </h2>
                {action}
            </div>

            {children}

        </section>
    );
}

function LeaderboardTable({headers, rows}: {
    headers: string[];
    rows: string[][];
}) {
    return(
        <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr style={{background: 'var(--bg-hover)',}}>
                        {headers.map((header) => (
                            <th
                                key={header}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => (
                        <tr key={row.join('-')} style={{ borderTop: '1px solid var(--border)' }}>
                            {row.map((cell) => (
                                <td
                                    key={cell}
                                    style={{
                                        padding: '14px 16px',
                                        color: 'var(--text-primary)',
                                        fontSize: 13,
                                    }}
                                >
                                {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}