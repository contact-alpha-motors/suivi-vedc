'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let appInstance: FirebaseApp | null = null;

/**
 * Initializes Firebase services safely for both SSR and Client.
 * On server, it returns null values to avoid illegal browser API calls.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null
    };
  }

  if (!appInstance) {
    try {
      appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (e) {
      appInstance = getApp();
    }
  }

  if (!firestoreInstance) {
    try {
      // Attempt to initialize with persistent cache for offline-first support
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e: any) {
      // If already initialized (common in HMR), retrieve existing instance
      firestoreInstance = getFirestore(appInstance);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }

  return {
    firebaseApp: appInstance,
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
