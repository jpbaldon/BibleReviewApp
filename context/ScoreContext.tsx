import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'
import { useServices } from '../context/ServicesContext';
import { LeaderboardEntry } from '../types/index';

interface ScoreContextType {
    overallScore: number;
    sessionScore: number;
    incrementOverallScore: (points: number) => Promise<void>;
    incrementSessionScore: (points: number) => void;
    resetSessionScore: () => void;
    syncScores: () => Promise<void>;
    fetchLeaderboardFromServer: (limit?: number) => Promise<LeaderboardEntry[]>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined)

export const useScore = () => {
    const context = useContext(ScoreContext);
    if(!context) {
        throw new Error('useScore must be used within a ScoreProvider');
    }
    return context;
}

interface ScoreProviderProps {
    children: ReactNode;
}

export const ScoreProvider: React.FC<ScoreProviderProps> = ({ children }) => {
    const [overallScore, setOverallScore] = useState<number>(0);
    const [sessionScore, setSessionScore] = useState<number>(0);
    const { user } = useAuth();
    const onlinedb = useServices();

    const getKey = React.useCallback((baseKey: string) => `${user?.id}_${baseKey}`, [user]);

    useEffect(() => {
        const loadScores = async () => {
            
            try {
                if(!user) {
                    setOverallScore(0);
                    setSessionScore(0);
                    return;
                }
                const [storedOverall, storedSession] = await Promise.all([
                    AsyncStorage.getItem(getKey('overallScore')),
                    AsyncStorage.getItem(getKey('sessionScore'))
                ]);

                setOverallScore(storedOverall ? parseInt(storedOverall, 10) : 0);
                setSessionScore(storedSession ? parseInt(storedSession, 10) : 0);

                await syncWithServer();
                
            } catch (error) {
                console.error('Error loading scores:', error);
            }
        };
        loadScores();
    }, [user, getKey]);

    useEffect(() => {
        if(!user) {
            setOverallScore(0);
            setSessionScore(0);
        }
    }, [user]);

    const syncWithServer = async () => {

        if (!user) return;

        try {
            const { overallScore: serverScore } = await onlinedb.score.getOverallScoreFromServer();
            const newScore = Math.max(overallScore, serverScore);

            if(newScore !== overallScore) {
                setOverallScore(newScore)
                await AsyncStorage.setItem(getKey('overallScore'), newScore.toString());
            }

            if(overallScore > serverScore) {
                await onlinedb.score.updateOverallScoreOnServer(overallScore);
            }
        } catch (error) {
            console.error('Error syncing scores:', error);
        }
    };

    const incrementOverallScore = async (points: number) => {
        const newOverallScore = overallScore + points;
        setOverallScore(newOverallScore);
        try {
            await AsyncStorage.setItem(getKey('overallScore'), newOverallScore.toString());

            if (user) {
                onlinedb.score.incrementUserScoreRpc(points);
            }

        } catch(error) {
            console.error('Error saving overall score:', error)
        }
    };

    const incrementSessionScore = async (points: number) => {
        const newSessionScore = sessionScore + points;
        setSessionScore(newSessionScore);
        if(user) {
            await AsyncStorage.setItem(getKey('sessionScore'), newSessionScore.toString());
        }
    };

    const resetSessionScore = async () => {
        setSessionScore(0);
        if(user) {
            await AsyncStorage.setItem(getKey('sessionScore'), '0');
        }
    };

    const syncScores = async () => {
        await syncWithServer();
    };

    const fetchLeaderboardFromServer = async (limit?: number) => {
        return await onlinedb.score.fetchTopScores(limit);
    }

    return (
        <ScoreContext.Provider 
            value={{
                overallScore,
                sessionScore,
                incrementOverallScore,
                incrementSessionScore,
                resetSessionScore,
                syncScores,
                fetchLeaderboardFromServer
            }}
        >
            {children}
        </ScoreContext.Provider>
    )
}