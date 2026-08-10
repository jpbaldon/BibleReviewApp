import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useServices } from '@/context/ServicesContext';
import { COMPETITIVE_SCOPES, COMPETITIVE_SCOPE_LABELS, type CompetitiveScope } from '@/utils/bibleScope';
import { isUserRankOne } from '@/utils/competitiveLeaderboard';

type ChampionCache = {
  userId: string;
  scopes: CompetitiveScope[];
};

let championCache: ChampionCache | null = null;

export function clearCompetitiveChampionCache() {
  championCache = null;
}

export function useCompetitiveChampion() {
  const { user } = useAuth();
  const server = useServices();
  const [championScopes, setChampionScopes] = useState<CompetitiveScope[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setChampionScopes([]);
      return;
    }

    if (championCache?.userId === user.id) {
      setChampionScopes(championCache.scopes);
      return;
    }

    setLoading(true);
    try {
      const scopes: CompetitiveScope[] = [];
      for (const scope of COMPETITIVE_SCOPES) {
        const data = await server.score.fetchTopCompetitiveScores(scope);
        if (isUserRankOne(data, user.id)) {
          scopes.push(scope);
        }
      }
      championCache = { userId: user.id, scopes };
      setChampionScopes(scopes);
    } catch {
      setChampionScopes([]);
    } finally {
      setLoading(false);
    }
  }, [user, server]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const championLabel =
    championScopes.length === 0
      ? null
      : championScopes.length === 1
        ? `#1 on ${COMPETITIVE_SCOPE_LABELS[championScopes[0]]}`
        : `#1 on ${championScopes.map((scope) => COMPETITIVE_SCOPE_LABELS[scope]).join(', ')}`;

  return {
    isChampion: championScopes.length > 0,
    championScopes,
    championLabel,
    loading,
    refresh,
  };
}
