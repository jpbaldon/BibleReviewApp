import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';

interface ConfettiContextType {
  showConfetti: (options?: { count?: number }) => void;
}

const ConfettiContext = createContext<ConfettiContextType>({
  showConfetti: () => {},
});

export const useConfetti = () => useContext(ConfettiContext);

export const ConfettiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiOptions, setConfettiOptions] = useState<{ count?: number }>({});

  const showConfetti = useCallback((options?: { count?: number }) => {
    setConfettiOptions(options || {});
    setConfettiKey(prev => prev + 1); // Triggers rerender
  }, []);

  return (
    <ConfettiContext.Provider value={{ showConfetti }}>
      {children}
      {/* Global ConfettiCannon, only rendered when key changes */}
      {confettiKey > 0 && (
        <>
          {/* @ts-ignore */}
          <ConfettiCannon
            key={confettiKey}
            count={confettiOptions.count || 200}
            origin={{ x: -10, y: 0 }}
            fadeOut={true}
            fallSpeed={3000}
            explosionSpeed={350}
          />
        </>
      )}
    </ConfettiContext.Provider>
  );
};
