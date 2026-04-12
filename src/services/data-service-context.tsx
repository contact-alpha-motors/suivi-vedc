'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { OfflineFirstService } from './implementations/offline-first-service';
import { FirebaseApiProvider } from './providers/firebase-api-provider';

const DataServiceContext = createContext<IDataService | null>(null);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const service = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const apiProvider = new FirebaseApiProvider();
      return new OfflineFirstService(apiProvider);
    } catch (error) {
      console.error('Failed to initialize DataService:', error);
      return null;
    }
  }, []);

  return (
    <DataServiceContext.Provider value={service}>
      {children}
    </DataServiceContext.Provider>
  );
};

export const useDataService = () => {
  const context = useContext(DataServiceContext);
  // Retourne null au lieu de throw pour la compatibilité SSR
  return context;
};
