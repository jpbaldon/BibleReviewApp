import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBackend } from './BackendContext';
import { createBackendServices } from '../hooks/createBackendServices';

const ServicesContext = createContext<ReturnType<typeof createBackendServices> | null>(null);

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within a ServicesProvider');
  return ctx;
};

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const backend = useBackend();

  const services = useMemo(() => {
    if (!user) return null;
    return createBackendServices(backend, user.id);
  }, [user, backend]);

  if (isLoading || (user && !services)) return null;

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
};