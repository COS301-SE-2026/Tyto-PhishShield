import React, { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Badge, Card, Input, Select, Spinner } from "../../components/ui";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { fetchLeaderboardXp, getInitials, groupUsersByDepartment, resolveDepartment,
    type XpNetEntry, } from "./leaderboard.service";
import {connectXpSocket } from "../../services/xp-socket";
import { Search } from "lucide-react";

interface LeaderboardProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

type LeaderboardTab = 'users' | 'departments';
type DepartmentRankMode = 'totalXP' | 'averageXP';
type DepartmentSizeFilter = 'all' | 'large' | 'small';
type LoadError = 'other' | null;

interface UserRow {
    id: string;
    name: string;
    department: string;
    xp: number;
    isSelf: boolean;
}

interface XpGivenAllPayload {
    auth0Id: string;
    amount: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({onNavigate, activePath}: Readonly<LeaderboardProps>) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('departments');
    const [departmentRankMode, setDepartmentRankMode] = useState<DepartmentRankMode>('totalXP');
    const [sizeFilter, setSizeFilter] = useState<DepartmentSizeFilter>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<LoadError>(null);
    const [xpEntries, setXpEntries] = useState<XpNetEntry[] | null>(null);
  
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        fetchLeaderboardXp()
            .then(data => { if (!cancelled) setXpEntries(data); })
            .catch(() => {
                if (cancelled) {
                    setLoadError('other');
                    addToast({ type: 'error', title: 'Could not load leaderboard', message: 'Please try again.' });
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    //Supplementary XP, no role restriction, live updates
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        fetchLeaderboardXp()
            .then(data => { if (!cancelled) setXpEntries(data); })
            .catch(() => {
                if (!cancelled) {
                    setLoadError('other');
                    addToast({ type: 'error', title: 'Could not load leaderboard', message: 'Please try again shortly.' });
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Live updates
    useEffect(() => {
        let cancelled = false;
        let socket: Awaited<ReturnType<typeof connectXpSocket>> | undefined;
        connectXpSocket().then( s => { if (cancelled) { s.disconnect(); return; } 
            socket = s;
                s.on('xp-given-all', ({ auth0Id, amount }: XpGivenAllPayload) => {
                    setXpEntries(prev => {
                        const list = prev ?? [];
                        const idx = list.findIndex(entry => entry.auth0Id === auth0Id);
                        if (idx === -1) {
                            if (auth0Id !== user?.auth0Id) return list;
                            return [...list, {
                                auth0Id: user.auth0Id,
                                name: user.name ?? user.email,
                                email: user.email,
                                department: null,
                                totalXp: amount,
                            }];
                        }
                        const updated = [...list];
                        updated[idx] = { ...updated[idx], totalXp: updated[idx].totalXp + amount };
                        return updated;
                    });
                });
            })
            .catch(() => undefined)
        return () => { 
            cancelled = true; 
            socket?.disconnect();
        };
    }, [user]);
    
    const userRows: UserRow[] = useMemo(() => {
       return (xpEntries ?? [])
            .map(entry => ({
                id: entry.auth0Id,
                name: entry.name?.trim() ? entry.name.trim() : entry.email,
                department: resolveDepartment(entry.department),
                xp: entry.totalXp,
                isSelf: !!user && entry.auth0Id === user.auth0Id,
            }))
            .sort((a, b) => b.xp - a.xp);
    }, [xpEntries, user]);

    const filteredUserRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return userRows;
        return userRows.filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
    }, [userRows, search]);

    const departmentGroups = useMemo(
        () => groupUsersByDepartment(userRows),
        [userRows],
    );

    const sortedDepartments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return departmentGroups
            .filter(d => !q || d.department.toLowerCase().includes(q))
            .filter(d => {
                if (sizeFilter === 'large') return d.members > 1;
                if (sizeFilter === 'small') return d.members <= 1;
                return true;
            })
            .sort((a, b) => b[departmentRankMode] - a[departmentRankMode]);
    }, [departmentGroups, sizeFilter, departmentRankMode, search]);

    return(
        <AppLayout activePath={activePath} onNavigate={onNavigate} title='Leaderboard'> 
            <main style={{ background: 'var(--bg-page)', minHeight: '100%', padding: 24 }}>
                <section style={{width: '100%'}}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 8,
                                gap: 6,
                                display: 'inline-flex',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            <TabButton 
                                active={activeTab === 'departments'}
                                onClick={() => setActiveTab('departments')}
                            >
                                Departments
                            </TabButton>

                            <TabButton 
                                active={activeTab === 'users'}
                                onClick={() => setActiveTab('users')}
                            >
                                Users
                            </TabButton>
                        </div>
                    
                        <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                            <Input
                               placeholder={activeTab === 'users' ? 'Search by name or department…' : 'Search by department…'}
                               value={search}
                               onChange={e => setSearch(e.target.value)}
                               leftIcon={<Search size={14} aria-hidden='true' />}
                            />
                        </div>
                    </div>

                    {activeTab === 'users' ? (
                        <LeaderboardCard title="User Leaderboard">
                            <LeaderboardBody
                                loading={loading}
                                loadError={loadError}
                                isEmpty={filteredUserRows.length === 0}
                                emptyMessage="No users match your search."
                            >
                                <LeaderboardTable
                                    headers ={['Rank', 'Name', 'Department', 'XP']}
                                    rows={filteredUserRows.map((u, index) => ({
                                        id: u.id,
                                        cells: [
                                        `#${index + 1}`,
                                        <UserCell
                                           key={u.id}
                                           name={u.name}
                                           isSelf={u.isSelf}
                                           medal={MEDALS[index]}
                                        />,
                                        u.department,
                                        u.xp.toLocaleString(),
                                        ],
                                    }))}
                                />
                            </LeaderboardBody>
                        </LeaderboardCard>
                    ) : (
                        <LeaderboardCard
                            title="Departments Leaderboard"
                            action={
                                <div style={{display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center'}}>
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
                                    
                                    <Select
                                        value={sizeFilter}
                                        onChange={e => setSizeFilter(e.target.value as DepartmentSizeFilter)}
                                        options={[
                                           { value: 'all', label: 'All Sizes' },
                                           { value: 'large', label: 'Larger Teams' },
                                           { value: 'small', label: 'Smaller Teams' },
                                        ]}
                                        style={{ minWidth: 132 }}
                                    />
                                </div>
                            }
                        >
                            <LeaderboardBody
                                loading={loading}
                                loadError={loadError}
                                isEmpty={sortedDepartments.length === 0}
                                emptyMessage="No departments match your filters."
                            >
                                <LeaderboardTable
                                    headers ={['Rank', 'Department', 'Members', 'Total XP', 'Average XP']}
                                    rows={sortedDepartments.map((department, index) => ({
                                        id: department.department,
                                        cells: [
                                        `#${index + 1}`,
                                        department.department,
                                        department.members.toString(),
                                        department.totalXP.toLocaleString(),
                                        department.averageXP.toLocaleString(),
                                        ],
                                    }))}
                                />
                            </LeaderboardBody>
                        </LeaderboardCard>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}

function TabButton ({active, onClick, children,} : Readonly<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}>) {
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

function UserCell({ name, isSelf, medal }: Readonly<{ name: string; isSelf: boolean; medal?: string }>) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
                style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}
            >
              {getInitials(name)}
            </div>
            <span style={{ fontWeight: 600 }}>{name}</span>
            {isSelf && <Badge variant="primary">You</Badge>}
            {medal && <span style={{ fontSize: 16 }}>{medal}</span>}
        </div>
    );
}

function EmptyState({ message }: Readonly<{ message: string }>) {
    return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, 
            fontFamily: 'Inter, system-ui, sans-serif' }}>
            {message}
        </div>
    );
}

function LeaderboardBody({ loading, loadError, isEmpty, emptyMessage, children }: Readonly<{
    loading: boolean;
    loadError: LoadError;
    isEmpty: boolean;
    emptyMessage: string;
    children: React.ReactNode;
}>) {
    if (loading) {
        return (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
                <Spinner size={24} />
            </div>
        );
    }
    if (loadError === 'other') {
        return <EmptyState message= "Couldn't load the leaderboard right now. Please try again." />;
    }
    if (isEmpty) {
        return <EmptyState message={emptyMessage} />;
    }
    return <>{children}</>;
}

function LeaderboardCard({title, action, children}: Readonly<{
    title:string;
    action?: React.ReactNode;
    children: React.ReactNode;
}>) {
    return (
        <Card>
            <div
                style={{
                    padding: '20px 24px 14px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h2 style={{fontSize: 18, fontWeight: 700}}>
                    {title}
                </h2>
                {action}
            </div>

            <div style={{ paddingTop: 4 }}>
                {children}
            </div>
        </Card>
    );
}

interface LeaderboardRow {
    id: string;
    cells: React.ReactNode[];
}

function LeaderboardTable({headers, rows}: Readonly<{
    headers: string[];
    rows: LeaderboardRow[];
}>) {
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
                        <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                            {row.cells.map((cell, j) => (
                                <td
                                    key={headers[j]}
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