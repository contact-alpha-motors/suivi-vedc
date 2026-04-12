
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { OfflineFirstService } from './implementations/offline-first-service';

const DataServiceContext = createContext<IDataService | undefined>(undefined);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Utilisation du service Offline First réel
  const service = useMemo(() => new OfflineFirstService(), []);

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
