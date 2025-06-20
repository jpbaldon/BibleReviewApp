import AsyncStorage from '@react-native-async-storage/async-storage';

export const setHoldToTryAnother = async (userId: string, value: boolean) => {
  await AsyncStorage.setItem(`holdToTryAnother-${userId}`, JSON.stringify(value));
};

export const getHoldToTryAnother = async (userId: string): Promise<boolean> => {
  const value = await AsyncStorage.getItem(`holdToTryAnother-${userId}`);
  return value ? JSON.parse(value) : false; // Default to false
};