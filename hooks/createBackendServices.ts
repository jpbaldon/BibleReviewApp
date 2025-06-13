import { Rarity, UserSettings, BackendService } from '../types/index';

export const createBackendServices = (backend: BackendService, userId: string) => {

  return {
    auth: backend.auth,
    bibleBooks: {
      fetchAll: () => backend.bibleBooks.fetchAll(userId),
      toggleEnabled: (bookName: string) => backend.bibleBooks.toggleEnabled(userId, bookName),
      updateChapterRarity: (bookName: string, chapterNum: number, rarity: Rarity) =>
        backend.bibleBooks.updateChapterRarity(userId, bookName, chapterNum, rarity),
    },
    score: {
      getOverallScoreFromServer: () => backend.score.getOverallScoreFromServer(userId),
      updateOverallScoreOnServer: (overallScore: number) => backend.score.updateOverallScoreOnServer(userId, overallScore),
      incrementUserScoreRpc: (points: number) => backend.score.incrementUserScoreRpc(userId, points),
      fetchTopScores: (limit?: number) => backend.score.fetchTopScores(limit),
    },
    usernames: {
      checkAvailability: (username: string) => backend.usernames.checkAvailability(username),
      updateUsername: (newUsername: string) => backend.usernames.updateUsername(userId, newUsername),
    },
    settings: {
      getSettings: () => backend.settings.getSettings(userId),
      updateSettings: (settings: UserSettings) => backend.settings.updateSettings(userId, settings),
    },
  };
};