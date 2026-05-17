import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHoldToTryAnother, setHoldToTryAnother, getTranslation, setTranslation } from '../utils/UserSettings';
import type { TranslationKey } from '../data/translations';

type SettingsContextType = {
  holdToTryAnother: boolean;
  setHoldToTryAnotherSetting: (value: boolean) => void;
  translation: TranslationKey;
  setTranslationSetting: (value: TranslationKey) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  holdToTryAnother: false,
  setHoldToTryAnotherSetting: () => {},
  translation: 'BSB',
  setTranslationSetting: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ userId, children }: { userId?: string | null; children: React.ReactNode }) => {
  const [holdToTryAnother, setHoldToTryAnotherState] = useState<boolean>(false);
  const [translation, setTranslationState] = useState<TranslationKey>('BSB');

  useEffect(() => {
    if (!userId) {
      // Reset to default when no user (logged out)
      setHoldToTryAnotherState(false);
      setTranslationState('BSB');
      return;
    }

    const loadSettings = async () => {
      try {
        const setting = await getHoldToTryAnother(userId);
        setHoldToTryAnotherState(setting);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setHoldToTryAnotherState(false);
      }

      try {
        const trans = await getTranslation(userId);
        setTranslationState(trans);
      } catch (error) {
        console.error('Failed to load translation setting:', error);
      }
    };

    loadSettings();
  }, [userId]);

  const setHoldToTryAnotherSetting = async (value: boolean) => {
    if (!userId) return;
    
    try {
      await setHoldToTryAnother(userId, value);
      setHoldToTryAnotherState(value);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const setTranslationSetting = async (value: TranslationKey) => {
    if (!userId) return;

    try {
      await setTranslation(userId, value);
      setTranslationState(value);
    } catch (error) {
      console.error('Failed to save translation setting:', error);
    }
  };

  return (
    <SettingsContext value={{ holdToTryAnother, setHoldToTryAnotherSetting, translation, setTranslationSetting }}>
      {children}
    </SettingsContext>
  );
};