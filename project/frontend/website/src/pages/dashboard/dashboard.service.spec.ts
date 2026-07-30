import { computeMyXpRank, type XpNetEntry } from './dashboard.service';

describe('computeMyXpRank', () => {
  const entries: XpNetEntry[] = [
    { auth0Id: 'auth0|a', name: 'A', email: 'a@example.com', department: 'Finance', totalXp: 300 },
    { auth0Id: 'auth0|b', name: 'B', email: 'b@example.com', department: 'Finance', totalXp: 100 },
    { auth0Id: 'auth0|c', name: 'C', email: 'c@example.com', department: null, totalXp: 200 },
  ];

  it('ranks the current user among all entries by descending XP', () => {
    expect(computeMyXpRank(entries, 'auth0|c')).toEqual({ xp: 200, rank: 2, totalRanked: 3 });
  });

  it('ranks the top scorer as #1', () => {
    expect(computeMyXpRank(entries, 'auth0|a')).toEqual({ xp: 300, rank: 1, totalRanked: 3 });
  });

  it('returns a null rank and 0 XP when the current user has no XP entry yet', () => {
    expect(computeMyXpRank(entries, 'auth0|unranked')).toEqual({ xp: 0, rank: null, totalRanked: 3 });
  });
});