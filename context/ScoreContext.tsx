import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useServices } from '../context/ServicesContext';
import { LeaderboardEntry } from '../types/index';
import { createOverallScoreSync } from '../utils/scoreSync';

interface ScoreContextType {
    overallScore: number;
    sessionScore: number;
    incrementOverallScore: (points: number) => Promise<void>;
    incrementSessionScore: (points: number) => void;
    resetSessionScore: () => void;
    syncScores: () => Promise<void>;
    fetchLeaderboardFromServer: (limit?: number) => Promise<LeaderboardEntry[]>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const useScore = () => {
    const context = useContext(ScoreContext);
    if (!context) {
        throw new Error('useScore must be used within a ScoreProvider');
    }
    return context;
};

interface ScoreProviderProps {
    children: ReactNode;
}

export const ScoreProvider: React.FC<ScoreProviderProps> = ({ children }) => {
    const [overallScore, setOverallScore] = useState<number>(0);
    const [sessionScore, setSessionScore] = useState<number>(0);
    const { user } = useAuth();
    const onlinedb = useServices();

    const userId = user?.id;
    const userIdRef = useRef(userId);
    userIdRef.current = userId;
    const onlinedbRef = useRef(onlinedb);
    onlinedbRef.current = onlinedb;
    const sessionScoreRef = useRef(0);

    const overallScoreSyncRef = useRef<ReturnType<typeof createOverallScoreSync> | null>(null);
    if (overallScoreSyncRef.current === null) {
        overallScoreSyncRef.current = createOverallScoreSync({
            getUserId: () => userIdRef.current,
            storage: AsyncStorage,
            getServer: () => onlinedbRef.current?.score ?? null,
            onChange: (score) => {
                setOverallScore(score);
            },
        });
    }

    const getSessionKey = useCallback(
        () => (userIdRef.current ? `${userIdRef.current}_sessionScore` : null),
        [],
    );

    useEffect(() => {
        let cancelled = false;
        const scoreSync = overallScoreSyncRef.current;
        if (!scoreSync) {
            return;
        }

        const loadScores = async () => {
            try {
                if (!userId) {
                    scoreSync.reset();
                    sessionScoreRef.current = 0;
                    setSessionScore(0);
                    return;
                }

                const storedSession = await AsyncStorage.getItem(`${userId}_sessionScore`);
                if (cancelled) {
                    return;
                }

                const parsedSession = storedSession ? parseInt(storedSession, 10) : 0;
                const sessionValue = Number.isFinite(parsedSession) ? parsedSession : 0;
                sessionScoreRef.current = sessionValue;
                setSessionScore(sessionValue);

                await scoreSync.loadFromStorage();
                if (cancelled) {
                    return;
                }
                await scoreSync.sync();
            } catch (error) {
                console.error('Error loading scores:', error);
            }
        };

        void loadScores();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const incrementOverallScore = useCallback(async (points: number) => {
        await overallScoreSyncRef.current?.increment(points);
    }, []);

    const incrementSessionScore = useCallback(async (points: number) => {
        if (!Number.isFinite(points) || points === 0) {
            return;
        }

        const next = sessionScoreRef.current + points;
        sessionScoreRef.current = next;
        setSessionScore(next);

        const key = getSessionKey();
        if (!key) {
            return;
        }

        try {
            await AsyncStorage.setItem(key, String(sessionScoreRef.current));
        } catch (error) {
            console.error('Error saving session score:', error);
        }
    }, [getSessionKey]);

    const resetSessionScore = useCallback(async () => {
        sessionScoreRef.current = 0;
        setSessionScore(0);

        const key = getSessionKey();
        if (!key) {
            return;
        }

        try {
            await AsyncStorage.setItem(key, '0');
        } catch (error) {
            console.error('Error resetting session score:', error);
        }
    }, [getSessionKey]);

    const syncScores = useCallback(async () => {
        await overallScoreSyncRef.current?.sync();
    }, []);

    const fetchLeaderboardFromServer = useCallback(async (limit?: number) => {
        return await onlinedb.score.fetchTopScores(limit);
    }, [onlinedb]);

    return (
        <ScoreContext
            value={{
                overallScore,
                sessionScore,
                incrementOverallScore,
                incrementSessionScore,
                resetSessionScore,
                syncScores,
                fetchLeaderboardFromServer,
            }}
        >
            {children}
        </ScoreContext>
    );
};
