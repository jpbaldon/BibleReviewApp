import React, { createContext, useContext } from 'react';
import { BackendService } from '../types';
import { SupabaseService } from '../database/supabase'

const BackendContext = createContext<BackendService | null>(null);

export const BackendProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <BackendContext.Provider value={SupabaseService}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) throw new Error('useBackend must be used inside a BackendProvider');
  return context;
};