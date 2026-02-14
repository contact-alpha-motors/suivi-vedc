
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore 
} from 'firebase/firestore';

// Singleton pour éviter les doubles initialisations
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialisation sécurisée de Firestore avec cache persistant
  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e) {
      // En cas d'erreur (déjà initialisé), on récupère l'instance existante
      firestoreInstance = getFirestore(app);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return {
    firebaseApp: app,
    auth: authInstance,
    firestore: firestoreInstance
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
