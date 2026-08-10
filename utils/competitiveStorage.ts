import {
  COMPETITIVE_SCOPES,
  type CompetitiveScope,
} from './bibleScope';

export type ChampionCelebratedData = Record<CompetitiveScope, boolean>;

export function emptyChampionCelebrated(): ChampionCelebratedData {
  return {
    full: false,
    ot: false,
    nt: false,
  };
}

export function parseChampionCelebrated(raw: string | null): ChampionCelebratedData {
  if (!raw) return emptyChampionCelebrated();

  try {
    const parsed = JSON.parse(raw) as Partial<ChampionCelebratedData>;
    const data = emptyChampionCelebrated();
    for (const scope of COMPETITIVE_SCOPES) {
      data[scope] = parsed[scope] === true;
    }
    return data;
  } catch {
    return emptyChampionCelebrated();
  }
}

export function championCelebratedStorageKey(userId: string): string {
  return `competitiveChampionCelebrated-${userId}`;
}

export type CompetitiveBestRecord = {
  bestScore: number;
  updatedAt: string | null;
};

export type CompetitiveStorageData = Record<CompetitiveScope, CompetitiveBestRecord>;

export function emptyCompetitiveStorage(): CompetitiveStorageData {
  return {
    full: { bestScore: 0, updatedAt: null },
    ot: { bestScore: 0, updatedAt: null },
    nt: { bestScore: 0, updatedAt: null },
  };
}

export function emptyCompetitiveBestScores(): Record<CompetitiveScope, number> {
  return { full: 0, ot: 0, nt: 0 };
}

export function parseCompetitiveStorage(raw: string | null): CompetitiveStorageData {
  if (!raw) return emptyCompetitiveStorage();

  try {
    const parsed = JSON.parse(raw) as Partial<CompetitiveStorageData> & {
      bestScore?: number;
      updatedAt?: string | null;
    };

    if (parsed.bestScore !== undefined && parsed.full === undefined) {
      const legacy = emptyCompetitiveStorage();
      legacy.full = {
        bestScore: parsed.bestScore || 0,
        updatedAt: parsed.updatedAt ?? null,
      };
      return legacy;
    }

    const data = emptyCompetitiveStorage();
    for (const scope of COMPETITIVE_SCOPES) {
      const entry = parsed[scope];
      if (entry) {
        data[scope] = {
          bestScore: entry.bestScore || 0,
          updatedAt: entry.updatedAt ?? null,
        };
      }
    }
    return data;
  } catch {
    return emptyCompetitiveStorage();
  }
}

export function competitiveStorageToBestScores(
  data: CompetitiveStorageData,
): Record<CompetitiveScope, number> {
  return {
    full: data.full.bestScore,
    ot: data.ot.bestScore,
    nt: data.nt.bestScore,
  };
}

export function setCompetitiveBest(
  data: CompetitiveStorageData,
  scope: CompetitiveScope,
  bestScore: number,
  updatedAt: string | null,
): CompetitiveStorageData {
  return {
    ...data,
    [scope]: { bestScore, updatedAt },
  };
}
