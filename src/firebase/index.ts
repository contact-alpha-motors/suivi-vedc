
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

export function initializeFirebase() {
  if (!appInstance) {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
  }

  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e: any) {
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
