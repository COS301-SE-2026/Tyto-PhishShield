import { getInitials, groupUsersByDepartment, resolveDepartment } from './leaderboard.service';

describe('resolveDepartment', () => {
  it('returns the trimmed department when present', () => {
    expect(resolveDepartment(' Finance ')).toBe('Finance');
  });

  it('falls back to Unassigned for null', () => {
    expect(resolveDepartment(null)).toBe('Unassigned');
  });

  it('falls back to Unassigned for an empty string', () => {
    expect(resolveDepartment(' ')).toBe('Unassigned');
  });

  it('falls back to Unassigned when undefined', () => {
    expect(resolveDepartment()).toBe('Unassigned');
  });
});

describe('getInitials', () => {
  it('uses first and last name initials when a full name is present', () => {
    expect(getInitials('Mr Bean')).toBe('MB');
  });

  it('falls back to the first two letters of a single-word name', () => {
    expect(getInitials('Superman')).toBe('SU');
  });

  it('falls back to the email when no name is present', () => {
    expect(getInitials(undefined, 'olifant@example.com')).toBe('OL');
  });

  it('falls back to ?? when neither the name nor the email is present', () => {
    expect(getInitials()).toBe('??');
  });
});

describe('groupUsersByDepartment', () => {
  const users = [
    { department: 'Finance', xp: 100 },
    { department: 'Finance', xp: 300 },
    { department: null, xp: 50 },
  ];

  it('groups members by department and computes total/average XP', () => {
    const finance = groupUsersByDepartment(users).find(g => g.department === 'Finance');
    expect(finance).toEqual({ department: 'Finance', members: 2, totalXP: 400, averageXP: 200 });
  });

  it('buckets users without a department under Unassigned', () => {
    const unassigned = groupUsersByDepartment(users).find(g => g.department === 'Unassigned');
    expect(unassigned).toEqual({ department: 'Unassigned', members: 1, totalXP: 50, averageXP: 50 });
  });
});
