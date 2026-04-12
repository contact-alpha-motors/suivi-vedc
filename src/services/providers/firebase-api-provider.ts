
'use client';

import { IApiProvider } from '../interfaces/api-provider.interface';
import { Item, Sale, Event, EventStock } from '@/lib/types';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Implémentation de l'IApiProvider pour Firebase Firestore.
 * Ce provider est un simple traducteur : il ne gère ni le cache ni le offline.
 */
export class FirebaseApiProvider implements IApiProvider {
  private db: Firestore;

  constructor() {
    const { firestore } = initializeFirebase();
    this.db = firestore;
  }

  /**
   * Helper pour convertir un document Firestore en objet typé
   * et transformer les Timestamps en objets Date JS.
   */
  private mapDoc<T>(doc: any): T {
    const data = doc.data();
    const result = { ...data, id: doc.id };
    
    for (const key in result) {
      if (result[key] && typeof result[key] === 'object' && 'seconds' in result[key]) {
        try {
          result[key] = (result[key] as Timestamp).toDate();
        } catch (e) {
          // Si la conversion échoue, on garde la valeur brute
        }
      }
    }
    return result as T;
  }

  async fetchItems(): Promise<Item[]> {
    const snap = await getDocs(collection(this.db, 'inventoryItems'));
    return snap.docs.map(d => this.mapDoc<Item>(d));
  }

  async saveItem(item: Item): Promise<void> {
    await setDoc(doc(this.db, 'inventoryItems', item.id), item);
  }

  async removeItem(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'inventoryItems', id));
  }

  async fetchEvents(): Promise<Event[]> {
    const snap = await getDocs(collection(this.db, 'events'));
    return snap.docs.map(d => this.mapDoc<Event>(d));
  }

  async saveEvent(event: Event): Promise<void> {
    const data = { 
      ...event, 
      date: Timestamp.fromDate(event.date) 
    };
    await setDoc(doc(this.db, 'events', event.id), data);
  }

  async removeEvent(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'events', id));
  }

  async fetchSales(): Promise<Sale[]> {
    const snap = await getDocs(collection(this.db, 'sales'));
    return snap.docs.map(d => this.mapDoc<Sale>(d));
  }

  async recordSale(sale: Sale): Promise<void> {
    const data = { 
      ...sale, 
      timestamp: Timestamp.fromDate(sale.timestamp) 
    };
    await setDoc(doc(this.db, 'sales', sale.id), data);
  }

  async fetchEventStocks(): Promise<EventStock[]> {
    const snap = await getDocs(collection(this.db, 'eventStocks'));
    return snap.docs.map(d => this.mapDoc<EventStock>(d));
  }

  async saveEventStock(stock: EventStock): Promise<void> {
    await setDoc(doc(this.db, 'eventStocks', stock.id), stock);
  }
}
