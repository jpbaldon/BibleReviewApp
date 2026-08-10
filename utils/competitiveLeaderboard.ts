import type { CompetitiveLeaderboardEntry } from '../types';

export type RankedCompetitiveEntry = CompetitiveLeaderboardEntry & { rank: number };

export function toRankedCompetitiveEntries(
  entries: CompetitiveLeaderboardEntry[],
): RankedCompetitiveEntry[] {
  return entries
    .filter((entry) => entry.competitive_score > 0)
    .map((entry, index) => ({
      ...entry,
      rank: entry.rank ?? index + 1,
    }));
}

export function splitCompetitiveLeaderboard(entries: CompetitiveLeaderboardEntry[]): {
  podium: RankedCompetitiveEntry[];
  list: RankedCompetitiveEntry[];
} {
  const ranked = toRankedCompetitiveEntries(entries);
  return {
    podium: ranked.filter((entry) => entry.rank <= 3),
    list: ranked.filter((entry) => entry.rank > 3),
  };
}

export function findUserRank(
  entries: CompetitiveLeaderboardEntry[],
  userId: string | undefined,
): number | null {
  if (!userId) return null;
  const ranked = toRankedCompetitiveEntries(entries);
  const match = ranked.find((entry) => entry.id === userId);
  return match?.rank ?? null;
}

export function isUserRankOne(
  entries: CompetitiveLeaderboardEntry[],
  userId: string | undefined,
): boolean {
  return findUserRank(entries, userId) === 1;
}

export function userRankSubtitle(
  rank: number | null,
  scopeLabel: string,
): string | null {
  if (!rank) return null;
  if (rank === 1) return `You're #1 on the ${scopeLabel} board!`;
  if (rank <= 3) return `You're #${rank} on the ${scopeLabel} board`;
  return null;
}

export function getPodiumSlot(
  podium: RankedCompetitiveEntry[],
  rank: 1 | 2 | 3,
): RankedCompetitiveEntry | null {
  return podium.find((entry) => entry.rank === rank) ?? null;
}
