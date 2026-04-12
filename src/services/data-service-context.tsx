
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { OfflineFirstService } from './implementations/offline-first-service';
import { MockApiProvider } from './providers/mock-api-provider';

const DataServiceContext = createContext<IDataService | undefined>(undefined);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Injection de dépendance : on assemble le cerveau (OfflineFirstService) 
  // avec ses muscles (MockApiProvider).
  // Pour passer à Flask plus tard, il suffira de remplacer MockApiProvider par FlaskApiProvider.
  const service = useMemo(() => {
    const apiProvider = new MockApiProvider();
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
