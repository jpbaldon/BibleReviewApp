import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranslationKey } from '../data/translations';

export const setHoldToTryAnother = async (userId: string, value: boolean) => {
  await AsyncStorage.setItem(`holdToTryAnother-${userId}`, JSON.stringify(value));
};

export const getHoldToTryAnother = async (userId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(`holdToTryAnother-${userId}`);
  return value ? JSON.parse(value) : false; // Default to false
};

export const setSoundEnabled = async (userId: string, value: boolean) => {
  await AsyncStorage.setItem(`soundEnabled-${userId}`, JSON.stringify(value));
};

export const getSoundEnabled = async (userId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(`soundEnabled-${userId}`);
  return value ? JSON.parse(value) : true; // Default to on
};

export const setTranslation = async (userId: string, value: TranslationKey) => {
  await AsyncStorage.setItem(`translation-${userId}`, value);
};

export const getTranslation = async (userId: string): Promise<TranslationKey> => {
  const value = await AsyncStorage.getItem(`translation-${userId}`);
  return (value as TranslationKey) ?? 'BSB';
};

export const setMicButtonEnabled = async (userId: string, value: boolean) => {
  await AsyncStorage.setItem(`micButtonEnabled-${userId}`, JSON.stringify(value));
};

export const getMicButtonEnabled = async (userId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(`micButtonEnabled-${userId}`);
  return value ? JSON.parse(value) : true;
};
