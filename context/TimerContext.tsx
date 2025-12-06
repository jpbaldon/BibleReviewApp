import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { useConfetti } from './ConfettiContext';
import { useAuth } from './AuthContext';
import { useServices } from './ServicesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface Timer {
  id: string;
  name: string;
  duration: number; // seconds
  remaining: number; // seconds
  isActive: boolean;
  bestSessionScore: number;
}

export interface CompetitiveTimer {
  id: string;
  name: string;
  duration: number; // 15 minutes in seconds
  remaining: number;
  isActive: boolean;
  bestScore: number;
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
  startCompetitiveTimer: () => void;
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

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const onlinedb = useServices();
  const getKey = (baseKey: string) => `${user?.id}_${baseKey}`;
  const [timers, setTimers] = useState<Timer[]>([]);
  const [timedSessionScore, setTimedSessionScore] = useState<number>(0);
  const [competitiveScore, setCompetitiveScore] = useState<number>(0);
  const [oldSessionBest, setOldSessionBest] = useState<number>(0);
  const [oldCompetitiveBest, setOldCompetitiveBest] = useState<number>(0);
  
  // Competitive Timer - Fixed 15 minutes
  const [competitiveTimer, setCompetitiveTimer] = useState<CompetitiveTimer>({
    id: 'competitive',
    name: 'Competitive Timer',
    duration: 300, // 15 minutes
    remaining: 300,
    isActive: false,
    bestScore: 0,
  });
  
  // Confetti trigger
  const confetti = useConfetti?.();
  // Load timers from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          setTimers([]);
          setActiveTimerId(null);
          setTimedSessionScore(0);
          setCompetitiveScore(0);
          setCompetitiveTimer(prev => ({ ...prev, isActive: false, remaining: prev.duration, bestScore: 0 }));
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
          return;
        }
        const stored = await AsyncStorage.getItem(getKey('timers'));
        const competitiveStored = await AsyncStorage.getItem(getKey('competitiveTimer'));
        
        let loadedTimers = stored ? JSON.parse(stored) : [];
        // On login, reset all timers to inactive and remaining = duration
        loadedTimers = (loadedTimers as Timer[]).map((t: Timer) => ({ ...t, isActive: false, remaining: t.duration }));
        setTimers(loadedTimers);
        setActiveTimerId(null);
        setTimedSessionScore(0);
        setCompetitiveScore(0);
        
        // Load competitive timer's best score from local storage first
        let localBest = 0;
        if (competitiveStored) {
          const parsedCompetitive = JSON.parse(competitiveStored);
          localBest = parsedCompetitive.bestScore || 0;
        }
        
        // Sync with server
        if (onlinedb) {
          try {
            const { competitiveScore: serverScore } = await onlinedb.score.getCompetitiveScoreFromServer();
            const bestScore = Math.max(localBest, serverScore);
            setCompetitiveTimer(prev => ({
              ...prev,
              bestScore,
              remaining: prev.duration,
              isActive: false,
            }));
            // Update local storage if server has higher score
            if (bestScore !== localBest) {
              await AsyncStorage.setItem(getKey('competitiveTimer'), JSON.stringify({ bestScore }));
            }
            // Update server if local has higher score
            if (localBest > serverScore) {
              await onlinedb.score.updateCompetitiveScoreOnServer(localBest);
            }
          } catch (e) {
            // If server sync fails, use local score
            setCompetitiveTimer(prev => ({
              ...prev,
              bestScore: localBest,
              remaining: prev.duration,
              isActive: false,
            }));
          }
        } else {
          setCompetitiveTimer(prev => ({
            ...prev,
            bestScore: localBest,
            remaining: prev.duration,
            isActive: false,
          }));
        }
        
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
      } catch (e) { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const intervalRef = useRef<any>(null);
  const competitiveIntervalRef = useRef<any>(null);

  const activeTimer = timers.find(t => t.id === activeTimerId) || null;

  useEffect(() => {
    if (activeTimer && activeTimer.isActive && activeTimer.remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimers(prev => prev.map(t => {
          if (t.id === activeTimer.id) {
            if (t.remaining > 1) {
              return { ...t, remaining: t.remaining - 1 };
            } else {
              // Timer hits 0, reset to duration and alert
              if (timedSessionScore > (oldSessionBest ?? 0)) {
                if (confetti && typeof confetti.showConfetti === 'function') {
                  confetti.showConfetti();
                } else {
                  console.warn('Confetti context is missing or showConfetti is not a function:', confetti);
                }
                updateBestSessionScore(activeTimer.id, timedSessionScore);
                Alert.alert('Timer Finished', `${t.name} Timer (${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}) has finished! You beat your previous session score of ${oldSessionBest}`);
              } else {
                Alert.alert('Timer Finished', `${t.name} Timer (${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}) has finished!`);
              }
              setTimedSessionScore(0);
              return { ...t, remaining: t.duration, isActive: false };
            }
          }
          return t;
        }));
      }, 1000) as any;
    } else if (activeTimer && activeTimer.remaining === 0) {
      stopTimer();
      // Optionally: trigger a global alert/modal here
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTimerId, activeTimer?.isActive, activeTimer?.remaining, timedSessionScore, confetti]);

  // Competitive Timer Effect
  useEffect(() => {
    if (competitiveTimer.isActive && competitiveTimer.remaining > 0) {
      competitiveIntervalRef.current = setInterval(() => {
        setCompetitiveTimer(prev => {
          if (prev.remaining > 1) {
            return { ...prev, remaining: prev.remaining - 1 };
          } else {
            // Competitive timer hits 0
            if (competitiveScore > (oldCompetitiveBest ?? 0)) {
              if (confetti && typeof confetti.showConfetti === 'function') {
                confetti.showConfetti();
              }
              // Update best score and save to AsyncStorage and server
              const newBest = competitiveScore;
              if (user) {
                AsyncStorage.setItem(getKey('competitiveTimer'), JSON.stringify({ bestScore: newBest }));
                // Sync with server
                if (onlinedb) {
                  onlinedb.score.updateCompetitiveScoreOnServer(newBest).catch(err => 
                    console.error('Failed to update competitive score on server:', err)
                  );
                }
              }
              Alert.alert('Competitive Timer Finished', `🏆 Competitive Timer has finished!\n\nNew best score: ${newBest}\n(Previous: ${oldCompetitiveBest ?? 0})`);
              return { ...prev, remaining: prev.duration, isActive: false, bestScore: newBest };
            } else {
              Alert.alert('Competitive Timer Finished', `Competitive Timer has finished!\n\nScore: ${competitiveScore}\nBest: ${oldCompetitiveBest ?? 0}`);
              return { ...prev, remaining: prev.duration, isActive: false };
            }
          }
        });
      }, 1000) as any;
    }
    return () => { if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current); };
  }, [competitiveTimer.isActive, competitiveTimer.remaining, competitiveScore, oldCompetitiveBest, confetti, user, getKey, onlinedb]);

  const addTimer = (name: string, duration: number) => {
    setTimers(prev => {
      if (prev.length >= 10) {
        Alert.alert('Limit Reached', 'You can only have up to 10 timers.');
        return prev;
      }
      const updated = [
        ...prev,
        { id: Date.now().toString(), name, duration, remaining: duration, isActive: false, bestSessionScore: 0 }
      ];
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };
  const updateBestSessionScore = (id: string, score: number) => {
    setTimers(prev => {
      const updated = prev.map(t =>
        t.id === id && score > t.bestSessionScore ? { ...t, bestSessionScore: score } : t
      );
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeTimer = (id: string) => {
    setTimers(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
    if (activeTimerId === id) stopTimer();
  };

  const startTimer = (id: string) => {
    // Stop competitive timer if running
    if (competitiveTimer.isActive) {
      setCompetitiveTimer(prev => ({ ...prev, isActive: false, remaining: prev.duration }));
      setCompetitiveScore(0);
      if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
    }
    
    setTimers(prev => prev.map(t =>
      t.id === id
        ? { ...t, isActive: true, remaining: t.remaining === 0 ? t.duration : t.remaining }
        : { ...t, isActive: false }
    ));
    setActiveTimerId(id);
    setTimedSessionScore(0);
    // Remove setOldSessionBest here; will be handled by useEffect below
  };
  // Always keep oldSessionBest in sync with the current activeTimer
  useEffect(() => {
    if (activeTimer) {
      setOldSessionBest(activeTimer.bestSessionScore || 0);
    }
  }, [activeTimer]);

  const stopTimer = () => {
    // If a timer was active and a new best was achieved, update bestSessionScore
    if (activeTimer && timedSessionScore > (oldSessionBest || 0)) {
      updateBestSessionScore(activeTimer.id, timedSessionScore);
      if (confetti) confetti.showConfetti();
    }
    if (activeTimer) {
      setTimers(prev => prev.map(t => t.id === activeTimer.id ? { ...t, remaining: t.duration, isActive: false } : t));
    }
    setActiveTimerId(null);
    setTimedSessionScore(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, remaining: t.duration, isActive: false } : t
    ));
    if (activeTimerId === id) stopTimer();
  };

  const updateTimer = (id: string, name: string, duration: number) => {
    setTimers(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, name, duration, remaining: duration } : t
      );
      if (user) {
        AsyncStorage.setItem(getKey('timers'), JSON.stringify(updated));
      }
      return updated;
    });
  };

  const incrementTimedSessionScore = async (points: number) => {
    const newTimedSessionScore = timedSessionScore + points;
    setTimedSessionScore(newTimedSessionScore);
    if (activeTimer) {
      setOldSessionBest(activeTimer.bestSessionScore || 0);
    }
  };

  const incrementCompetitiveScore = async (points: number) => {
    const newCompetitiveScore = competitiveScore + points;
    setCompetitiveScore(newCompetitiveScore);
  };

  const startCompetitiveTimer = () => {
    // Stop any active session timer
    if (activeTimer) {
      stopTimer();
    }
    
    setOldCompetitiveBest(competitiveTimer.bestScore || 0);
    setCompetitiveScore(0);
    setCompetitiveTimer(prev => ({
      ...prev,
      isActive: true,
      remaining: prev.duration,
    }));
  };

  const stopCompetitiveTimer = () => {
    // Check if we beat the previous best and update if so
    if (competitiveTimer.isActive && competitiveScore > (oldCompetitiveBest || 0)) {
      const newBest = competitiveScore;
      setCompetitiveTimer(prev => ({ ...prev, bestScore: newBest, isActive: false, remaining: prev.duration }));
      if (user) {
        AsyncStorage.setItem(getKey('competitiveTimer'), JSON.stringify({ bestScore: newBest }));
        // Sync with server
        if (onlinedb) {
          onlinedb.score.updateCompetitiveScoreOnServer(newBest).catch(err => 
            console.error('Failed to update competitive score on server:', err)
          );
        }
      }
      if (confetti) confetti.showConfetti();
    } else {
      setCompetitiveTimer(prev => ({ ...prev, isActive: false, remaining: prev.duration }));
    }
    
    setCompetitiveScore(0);
    if (competitiveIntervalRef.current) clearInterval(competitiveIntervalRef.current);
  };

  return (
    <TimerContext value={{
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
      updateBestSessionScore
    }}>
      {children}
    </TimerContext>
  );
};
