
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { MockDataService } from './implementations/mock-data-service';

const DataServiceContext = createContext<IDataService | undefined>(undefined);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pour l'instant, nous injectons l'implémentation Mock
  const service = useMemo(() => new MockDataService(), []);

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
