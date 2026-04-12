
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { OfflineFirstService } from './implementations/offline-first-service';
import { FirebaseApiProvider } from './providers/firebase-api-provider';

const DataServiceContext = createContext<IDataService | undefined>(undefined);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Injection de dépendance : On assemble le cerveau (OfflineFirstService) 
  // avec ses muscles réels (FirebaseApiProvider).
  // Pour passer à Flask plus tard, il suffira de remplacer FirebaseApiProvider par FlaskApiProvider.
  const service = useMemo(() => {
    const apiProvider = new FirebaseApiProvider();
    return new OfflineFirstService(apiProvider);
  }, []);

  return (
    <DataServiceContext.Provider value={service}>
      {children}
    </DataServiceContext.Provider>
  );
};

export const useDataService = () => {
  const context = useContext(DataServiceContext);
  if (!context) {
    throw new Error('useDataService must be used within a DataServiceProvider');
  }
  return context;
};
