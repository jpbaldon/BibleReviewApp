import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHoldToTryAnother, setHoldToTryAnother } from '../utils/UserSettings';

type SettingsContextType = {
  holdToTryAnother: boolean;
  setHoldToTryAnotherSetting: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider = ({ userId, children }: { userId: string; children: React.ReactNode }) => {
  const [holdToTryAnother, setHoldToTryAnotherState] = useState(false);

  useEffect(() => {
    (async () => {
      const setting = await getHoldToTryAnother(userId);
      setHoldToTryAnotherState(setting);
    })();
  }, [userId]);

  const setHoldToTryAnotherSetting = async (value: boolean) => {
    await setHoldToTryAnother(userId, value);
    setHoldToTryAnotherState(value);
  };

  return (
    <SettingsContext.Provider value={{ holdToTryAnother, setHoldToTryAnotherSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};