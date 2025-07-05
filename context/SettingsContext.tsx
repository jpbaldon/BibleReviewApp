import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHoldToTryAnother, setHoldToTryAnother } from '../utils/UserSettings';

type SettingsContextType = {
  holdToTryAnother: boolean;
  setHoldToTryAnotherSetting: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  holdToTryAnother: false, // Default value
  setHoldToTryAnotherSetting: () => {} // No-op function
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ userId, children }: { userId?: string | null; children: React.ReactNode }) => {
  const [holdToTryAnother, setHoldToTryAnotherState] = useState(false);

  useEffect(() => {
    if (!userId) {
      // Reset to default when no user (logged out)
      setHoldToTryAnotherState(false);
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
    };

    loadSettings();
  }, [userId]);

  const setHoldToTryAnotherSetting = async (value: boolean) => {
    if (!userId) return; // Don't save if no user
    
    try {
      await setHoldToTryAnother(userId, value);
      setHoldToTryAnotherState(value);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ holdToTryAnother, setHoldToTryAnotherSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};