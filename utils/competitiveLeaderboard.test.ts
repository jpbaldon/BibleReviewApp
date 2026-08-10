import {
  findUserRank,
  getPodiumSlot,
  isUserRankOne,
  splitCompetitiveLeaderboard,
  userRankSubtitle,
} from './competitiveLeaderboard';
import type { CompetitiveLeaderboardEntry } from '../types';

const entries: CompetitiveLeaderboardEntry[] = [
  { id: 'a', username: 'Alpha', competitive_score: 100, rank: 1 },
  { id: 'b', username: 'Beta', competitive_score: 80, rank: 2 },
  { id: 'c', username: 'Gamma', competitive_score: 60, rank: 3 },
  { id: 'd', username: 'Delta', competitive_score: 40, rank: 4 },
  { id: 'e', username: 'Empty', competitive_score: 0, rank: 5 },
];

describe('splitCompetitiveLeaderboard', () => {
  it('splits top 3 from the rest and ignores zero scores', () => {
    const { podium, list } = splitCompetitiveLeaderboard(entries);
    expect(podium).toHaveLength(3);
    expect(podium.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(list).toHaveLength(1);
    expect(list[0].username).toBe('Delta');
  });
});

describe('findUserRank', () => {
  it('returns rank for a scored user and null when absent or unscored', () => {
    expect(findUserRank(entries, 'b')).toBe(2);
    expect(findUserRank(entries, 'e')).toBeNull();
    expect(findUserRank(entries, 'missing')).toBeNull();
    expect(findUserRank(entries, undefined)).toBeNull();
  });
});

describe('isUserRankOne', () => {
  it('detects the top player only', () => {
    expect(isUserRankOne(entries, 'a')).toBe(true);
    expect(isUserRankOne(entries, 'b')).toBe(false);
  });
});

describe('userRankSubtitle', () => {
  it('returns podium messaging for ranks 1-3', () => {
    expect(userRankSubtitle(1, 'Full Bible')).toBe("You're #1 on the Full Bible board!");
    expect(userRankSubtitle(2, 'Old Testament')).toBe("You're #2 on the Old Testament board");
    expect(userRankSubtitle(4, 'New Testament')).toBeNull();
  });
});

describe('getPodiumSlot', () => {
  it('returns the entry for a podium rank', () => {
    const { podium } = splitCompetitiveLeaderboard(entries);
    expect(getPodiumSlot(podium, 1)?.username).toBe('Alpha');
    expect(getPodiumSlot(podium, 3)?.username).toBe('Gamma');
  });
});
