import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CompetitiveScope } from './bibleScope';
import {
  championCelebratedStorageKey,
  parseChampionCelebrated,
  type ChampionCelebratedData,
} from './competitiveStorage';

export async function readChampionCelebrated(userId: string): Promise<ChampionCelebratedData> {
  const raw = await AsyncStorage.getItem(championCelebratedStorageKey(userId));
  return parseChampionCelebrated(raw);
}

export async function setChampionCelebrated(
  userId: string,
  scope: CompetitiveScope,
  celebrated: boolean,
): Promise<void> {
  const data = await readChampionCelebrated(userId);
  data[scope] = celebrated;
  await AsyncStorage.setItem(championCelebratedStorageKey(userId), JSON.stringify(data));
}
