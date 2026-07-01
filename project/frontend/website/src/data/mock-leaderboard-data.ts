export interface MockUserLeaderboardEntry {
    id: string;
    name: string;
    department: string;
    xp: number;
}

export interface MockDepartmentLeaderboardEntry {
    id: string;
    department: string;
    members: number;
    totalXP: number;
    averageXP: number;
}

export const MockUserLeaderboard: MockUserLeaderboardEntry[] = [
    {id: '1', name: 'Mr Bean', department: 'IT & Security', xp: 9001},
    {id: '2', name: 'Five Guys', department: 'Executive', xp: 8888},
    {id: '3', name: 'Oom Olifant', department: 'Finance', xp: 5000},
    {id: '4', name: 'Chrissie Vissie', department: 'Finance', xp: 4000},
    {id: '5', name: 'Saul Goodman', department: 'Legal & Compliance', xp: 1200},
    {id: '6', name: 'Superman', department: 'Operations', xp: 999},
    {id: '7', name: '"Do you have a minute..."', department: 'Human Resources', xp: 0},
];

export const MockDepartmentLeaderboard: MockDepartmentLeaderboardEntry[] = [
    {id: '1', department: 'IT & Security', members: 1, totalXP: 9001, averageXP: 9001},
    {id: '2', department: 'Executive', members: 1, totalXP: 8888, averageXP: 8888},
    {id: '3', department: 'Finance', members: 2, totalXP: 9000, averageXP: 4500},
    {id: '4', department: 'Legal & Compliance', members: 1, totalXP: 1200, averageXP: 1200},
    {id: '5', department: 'Operations', members: 1, totalXP: 999, averageXP: 999},
    {id: '6', department: 'Human Resources', members: 1, totalXP: 0, averageXP: 0},
];
