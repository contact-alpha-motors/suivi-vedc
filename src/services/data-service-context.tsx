'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IDataService } from './interfaces/data-service.interface';
import { OfflineFirstService } from './implementations/offline-first-service';
import { FirebaseApiProvider } from './providers/firebase-api-provider';

const DataServiceContext = createContext<IDataService | null>(null);

export const DataServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [service, setService] = useState<IDataService | null>(null);

  useEffect(() => {
    // Initialisation uniquement côté client
    if (typeof window !== 'undefined') {
      try {
        const apiProvider = new FirebaseApiProvider();
        const offlineService = new OfflineFirstService(apiProvider);
        setService(offlineService);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du DataService:', error);
      }
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
  // Retourne null si le service n'est pas encore prêt (initialisation asynchrone)
  return context;
};
