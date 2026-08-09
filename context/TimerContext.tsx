import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useConfetti } from './ConfettiContext';
import { useAuth } from './AuthContext';
import { useServices } from './ServicesContext';
import { useAlert } from './AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COMPETITIVE_SCOPES,
  COMPETITIVE_SCOPE_LABELS,
  competitiveDurationSeconds,
  type CompetitiveScope,
} from '../utils/bibleScope';
import {
  competitiveStorageToBestScores,
  emptyCompetitiveBestScores,
  parseCompetitiveStorage,
  setCompetitiveBest,
  type CompetitiveStorageData,
} from '../utils/competitiveStorage';

export interface Timer {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  isActive: boolean;
  bestSessionScore: number;
}

export interface CompetitiveTimer {
  id: string;
  duration: number;
  remaining: number;
  isActive: boolean;
  activeScope: CompetitiveScope | null;
  bestScores: Record<CompetitiveScope, number>;
}

interface TimerContextType {
  timers: Timer[];
  activeTimer: Timer | null;
  competitiveTimer: CompetitiveTimer;
  timedSessionScore: number;
  competitiveScore: number;
  incrementTimedSessionScore: (score: number) => void;
  incrementCompetitiveScore: (score: number) => void;
  addTimer: (name: string, duration: number) => void;
  removeTimer: (id: string) => void;
  startTimer: (id: string) => void;
  stopTimer: () => void;
  startCompetitiveTimer: (scope: CompetitiveScope) => void;
  stopCompetitiveTimer: () => void;
  resetTimer: (id: string) => void;
  updateTimer: (id: string, name: string, duration: number) => void;
  updateBestSessionScore: (id: string, score: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
};

async function syncCompetitiveScopeWithServer(
  scope: CompetitiveScope,
  storage: CompetitiveStorageData,
  getCompetitiveScoreFromServer: (scope?: CompetitiveScope) => Promise<{
    competitiveScore: number;
    compScoreUpdate: string | null;
  }>,
  updateCompetitiveScoreOnServer: (score: number, scope?: CompetitiveScope) => Promise<void>,
): Promise<CompetitiveStorageData> {
  const localEntry = storage[scope];
  const { competitiveScore: serverScore, compScoreUpdate: serverUpdatedAt } =
    await getCompetitiveScoreFromServer(scope);

  let localWins = false;
  if (localEntry.updatedAt !== null && serverUpdatedAt !== null) {
    localWins = localEntry.updatedAt > serverUpdatedAt;
  } else if (localEntry.updatedAt !== null && serverUpdatedAt === null) {
    localWins = true;
  }

  const bestScore = localWins ? localEntry.bestScore : serverScore;
  const updatedAt = localWins ? localEntry.updatedAt : serverUpdatedAt;

  if (localWins && localEntry.bestScore !== serverScore) {
    await updateCompetitiveScoreOnServer(localEntry.bestScore, scope);
  }

  return setCompetitiveBest(storage, scope, bestScore, updatedAt);
}

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const onlinedb = useServices();
  const getKey = (baseKey: string) => `${user?.id}_${baseKey}`;
  const [timers, setTimers] = useState<Timer[]>([]);
  const [timedSessionScore, setTimedSessionScore] = useState<number>(0);
  const [competitiveScore, setCompetitiveScore] = useState<number>(0);
  const [oldSessionBest, setOldSessionBest] = useState<number>(0);
  const [oldCompetitiveBest, setOldCompetitiveBest] = useState<number>(0);

  const [competitiveTimer, setCompetitiveTimer] = useState<CompetitiveTimer>({
    id: 'competitive',
    duration: 300,
    remaining: 300,
    isActive: false,
    activeScope: null,
    bestScores: emptyCompetitiveBestScores(),
  });

  const confetti = useConfetti?.();
  const { showAlert, showToast } = useAlert();

  const competitiveScoreRef = useRef(0);
  const oldCompetitiveBestRef = useRef(0);
  const activeScopeRef = useRef<CompetitiveScope | null>(null);

  useEffect(() => {
    competitiveScoreRef.current = competitiveScore;
  }, [competitiveScore]);

  useEffect(() => {
    oldCompetitiveBestRef.current = oldCompetitiveBest;
  }, [oldCompetitiveBest]);

  useEffect(() => {
    activeScopeRef.current = competitiveTimer.activeScope;
  }, [competitiveTimer.activeScope]);

  const persistCompetitiveStorage = async (data: CompetitiveStorageData) => {
    if (!user) return;
    await AsyncStorage.setItem(getKey('competitiveTimer'), JSON.stringify(data));
  };

  const saveCompetitiveBest = async (scope: CompetitiveScope, bestScore: number) => {
    if (!user) return;
    const updatedAt = new Date().toISOString();
    const raw = await AsyncStorage.getItem(getKey('competitiveTimer'));
    const storage = setCompetitiveBest(parseCompetitiveStorage(raw), scope, bestScore, updatedAt);
    await persistCompetitiveStorage(storage);
    if (onlinedb) {
      await onlinedb.score.updateCompetitiveScoreOnServer(bestScore, scope);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          setTimers([]);
          setActiveTimerId(null);
          setTimedSessionScore(0);
          setCompetitiveScore(0);
          setCompetitiveTimer((prev) => ({
            ...prev,
            isActive: false,
            remaining: prev.duration,
            activeScope: null,
            bestScores: emptyCompetitiveBestScores(),
          }));
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
          return;
        }

        const stored = await AsyncStorage.getItem(getKey('timers'));
        const competitiveStored = await AsyncStorage.getItem(getKey('competitiveTimer'));

        let loadedTimers = stored ? JSON.parse(stored) : [];
        loadedTimers = (loadedTimers as Timer[]).map((t: Timer) => ({
          ...t,
          isActive: false,
          remaining: t.duration,
        }));
        setTimers(loadedTimers);
        setActiveTimerId(null);
        setTimedSessionScore(0);
        setCompetitiveScore(0);

        let storage = parseCompetitiveStorage(competitiveStored);

        if (onlinedb) {
          try {
            for (const scope of COMPETITIVE_SCOPES) {
              storage = await syncCompetitiveScopeWithServer(
                scope,
                storage,
                onlinedb.score.getCompetitiveScoreFromServer,
                onlinedb.score.updateCompetitiveScoreOnServer,
              );
            }
            await persistCompetitiveStorage(storage);
          } catch {
            // Use local storage if server sync fails
          }
        }

        setCompetitiveTimer((prev) => ({
          ...prev,
          bestScores: competitiveStorageToBestScores(storage),
          remaining: prev.duration,
          isActive: false,
          activeScope: null,
        }));

        if (intervalRef.current) clearInterval(intervalRef.current);
        if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const competitiveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeTimer = timers.find((t) => t.id === activeTimerId) || null;

  useEffect(() => {
    if (activeTimer && activeTimer.isActive && activeTimer.remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimers((prev) =>
          prev.map((t) => {
            if (t.id === activeTimer.id) {
              if (t.remaining > 1) {
                return { ...t, remaining: t.remaining - 1 };
              }
              const durationLabel = `${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}`;
              const beatBest = timedSessionScore > (oldSessionBest ?? 0);
              const finishedTimerId = activeTimer.id;
              const finishedScore = timedSessionScore;
              const previousBest = oldSessionBest;

              setTimeout(() => {
                if (beatBest) {
                  if (confetti && typeof confetti.showConfetti === 'function') {
                    confetti.showConfetti();
                  } else {
                    console.warn('Confetti context is missing or showConfetti is not a function:', confetti);
                  }
                  updateBestSessionScore(finishedTimerId, finishedScore);
                  showAlert({
                    title: 'Timer Finished',
                    message: `${t.name} Timer (${durationLabel}) has finished! You beat your previous session score of ${previousBest}`,
                    variant: 'success',
                  });
                } else {
                  showAlert({
                    title: 'Timer Finished',
                    message: `${t.name} Timer (${durationLabel}) has finished!`,
                    variant: 'info',
                  });
                }
                setTimedSessionScore(0);
              }, 0);
              return { ...t, remaining: t.duration, isActive: false };
            }
            return t;
          }),
        );
      }, 1000);
    } else if (activeTimer && activeTimer.remaining === 0) {
      stopTimer();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimerId, activeTimer?.isActive, activeTimer?.remaining, timedSessionScore, confetti]);

  useEffect(() => {
    if (competitiveTimer.isActive && competitiveTimer.remaining > 0) {
      competitiveIntervalRef.current = setInterval(() => {
        setCompetitiveTimer((prev) => {
          if (prev.remaining > 1) {
            return { ...prev, remaining: prev.remaining - 1 };
          }

          const scope = activeScopeRef.current ?? 'full';
          const scopeLabel = COMPETITIVE_SCOPE_LABELS[scope];
          const score = competitiveScoreRef.current;
          const previousBest = oldCompetitiveBestRef.current;
          const beatBest = score > (previousBest ?? 0);

          setTimeout(() => {
            if (beatBest) {
              if (confetti && typeof confetti.showConfetti === 'function') {
                confetti.showConfetti();
              }
              void saveCompetitiveBest(scope, score);
              showAlert({
                title: 'Competitive Timer Finished',
                message: `${scopeLabel} competitive timer has finished!\n\nNew best score: ${score}\n(Previous: ${previousBest ?? 0})`,
                variant: 'success',
              });
            } else {
              showAlert({
                title: 'Competitive Timer Finished',
                message: `${scopeLabel} competitive timer has finished!\n\nScore: ${score}\nBest: ${previousBest ?? 0}`,
                variant: 'info',
              });
            }
          }, 0);

          if (beatBest) {
            return {
              ...prev,
              remaining: prev.duration,
              isActive: false,
              activeScope: null,
              bestScores: { ...prev.bestScores, [scope]: score },
            };
          }

          return { ...prev, remaining: prev.duration, isActive: false, activeScope: null };
        });
      }, 1000);
    }
    return () => {
      if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
    };
  }, [competitiveTimer.isActive, competitiveTimer.remaining, confetti, user, onlinedb]);

  const addTimer = (name: string, duration: number) => {
    setTimers((prev) => {
      if (prev.length >= 10) {
        setTimeout(() => {
          showToast({
            title: 'Limit Reached',
            message: 'You can only have up to 10 timers.',
            variant: 'warning',
          });
        }, 0);
        return prev;
      }
      const updated = [
        ...prev,
        {
          id: Date.now().toString(),
          name,
          duration,
          remaining: duration,
          isActive: false,
          bestSessionScore: 0,
        },
      ];
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateBestSessionScore = (id: string, score: number) => {
    setTimers((prev) => {
      const updated = prev.map((t) =>
        t.id === id && score > t.bestSessionScore ? { ...t, bestSessionScore: score } : t,
      );
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeTimer = (id: string) => {
    setTimers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
    if (activeTimerId === id) stopTimer();
  };

  const startTimer = (id: string) => {
    if (competitiveTimer.isActive) {
      setCompetitiveTimer((prev) => ({
        ...prev,
        isActive: false,
        remaining: prev.duration,
        activeScope: null,
      }));
      setCompetitiveScore(0);
      if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
    }

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isActive: true, remaining: t.remaining === 0 ? t.duration : t.remaining }
          : { ...t, isActive: false },
      ),
    );
    setActiveTimerId(id);
    setTimedSessionScore(0);
  };

  useEffect(() => {
    if (activeTimer) {
      setOldSessionBest(activeTimer.bestSessionScore || 0);
    }
  }, [activeTimer]);

  const stopTimer = () => {
    if (activeTimer && timedSessionScore > (oldSessionBest || 0)) {
      updateBestSessionScore(activeTimer.id, timedSessionScore);
      if (confetti) confetti.showConfetti();
    }
    if (activeTimer) {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === activeTimer.id ? { ...t, remaining: t.duration, isActive: false } : t,
        ),
      );
    }
    setActiveTimerId(null);
    setTimedSessionScore(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, remaining: t.duration, isActive: false } : t)),
    );
    if (activeTimerId === id) stopTimer();
  };

  const updateTimer = (id: string, name: string, duration: number) => {
    setTimers((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, name, duration, remaining: duration } : t,
      );
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };

  const incrementTimedSessionScore = async (points: number) => {
    setTimedSessionScore((prev) => prev + points);
    if (activeTimer) {
      setOldSessionBest(activeTimer.bestSessionScore || 0);
    }
  };

  const incrementCompetitiveScore = async (points: number) => {
    setCompetitiveScore((prev) => prev + points);
  };

  const startCompetitiveTimer = (scope: CompetitiveScope) => {
    if (activeTimer) {
      stopTimer();
    }

    const scopeBest = competitiveTimer.bestScores[scope] || 0;
    const duration = competitiveDurationSeconds(scope);
    setOldCompetitiveBest(scopeBest);
    setCompetitiveScore(0);
    setCompetitiveTimer((prev) => ({
      ...prev,
      isActive: true,
      duration,
      remaining: duration,
      activeScope: scope,
    }));
  };

  const stopCompetitiveTimer = () => {
    const scope = competitiveTimer.activeScope ?? 'full';
    if (competitiveTimer.isActive && competitiveScore > (oldCompetitiveBest || 0)) {
      const newBest = competitiveScore;
      setCompetitiveTimer((prev) => ({
        ...prev,
        bestScores: { ...prev.bestScores, [scope]: newBest },
        isActive: false,
        remaining: prev.duration,
        activeScope: null,
      }));
      void saveCompetitiveBest(scope, newBest);
      if (confetti) confetti.showConfetti();
    } else {
      setCompetitiveTimer((prev) => ({
        ...prev,
        isActive: false,
        remaining: prev.duration,
        activeScope: null,
      }));
    }

    setCompetitiveScore(0);
    if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
  };

  return (
    <TimerContext
      value={{
        timers,
        activeTimer,
        competitiveTimer,
        timedSessionScore,
        competitiveScore,
        incrementTimedSessionScore,
        incrementCompetitiveScore,
        addTimer,
        removeTimer,
        startTimer,
        stopTimer,
        startCompetitiveTimer,
        stopCompetitiveTimer,
        resetTimer,
        updateTimer,
        updateBestSessionScore,
      }}
    >
      {children}
    </TimerContext>
  );
};
