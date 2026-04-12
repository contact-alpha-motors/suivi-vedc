
'use client';

import { IDataService, SyncStatus } from '../interfaces/data-service.interface';
import { Item, Sale, Event, EventStock } from '@/lib/types';
import { db, OutboxItem } from '../db';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  Timestamp, 
  Firestore, 
  getFirestore,
  writeBatch
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { liveQuery } from 'dexie';

export class OfflineFirstService implements IDataService {
  private firestore: Firestore;
  private isOnline: boolean = true;

  constructor() {
    const { firestore } = initializeFirebase();
    this.firestore = firestore;
    this.setupConnectivityListener();
    this.startSyncLoop();
    this.setupRemoteListeners();
  }

  private setupConnectivityListener() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOutbox();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private setupRemoteListeners() {
    // Écouter les changements distants pour garder le cache local à jour
    onSnapshot(collection(this.firestore, 'inventoryItems'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = { ...change.doc.data(), id: change.doc.id } as Item;
        if (change.type === 'removed') {
          await db.items.delete(change.doc.id);
        } else {
          await db.items.put(data);
        }
      });
    });

    onSnapshot(collection(this.firestore, 'events'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const docData = change.doc.data();
        const data = { 
          ...docData, 
          id: change.doc.id, 
          date: (docData.date as Timestamp).toDate() 
        } as Event;
        if (change.type === 'removed') {
          await db.events.delete(change.doc.id);
        } else {
          await db.events.put(data);
        }
      });
    });

    onSnapshot(collection(this.firestore, 'sales'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const docData = change.doc.data();
        const data = { 
          ...docData, 
          id: change.doc.id, 
          timestamp: (docData.timestamp as Timestamp).toDate() 
        } as Sale;
        if (change.type === 'removed') {
          await db.sales.delete(change.doc.id);
        } else {
          await db.sales.put(data);
        }
      });
    });

    onSnapshot(collection(this.firestore, 'eventStocks'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = { ...change.doc.data(), id: change.doc.id } as EventStock;
        if (change.type === 'removed') {
          await db.eventStocks.delete(change.doc.id);
        } else {
          await db.eventStocks.put(data);
        }
      });
    });
  }

  private async startSyncLoop() {
    // Traiter l'outbox au démarrage si en ligne
    if (this.isOnline) {
      await this.processOutbox();
    }
  }

  private async processOutbox() {
    const pending = await db.outbox.orderBy('timestamp').toArray();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        const docRef = doc(this.firestore, item.entityType, item.data.id);
        if (item.operation === 'delete') {
          await deleteDoc(docRef);
        } else {
          const syncData = { ...item.data };
          // Convertir les dates en Timestamps Firestore pour la sync
          if (syncData.date instanceof Date) syncData.date = Timestamp.fromDate(syncData.date);
          if (syncData.timestamp instanceof Date) syncData.timestamp = Timestamp.fromDate(syncData.timestamp);
          
          await setDoc(docRef, syncData, { merge: true });
        }
        await db.outbox.delete(item.id!);
      } catch (e) {
        console.error('Erreur de synchronisation pour l\'élément outbox:', item, e);
        // On arrête si on est hors-ligne ou erreur critique
        if (!navigator.onLine) break;
      }
    }
  }

  private async queueOperation(entityType: OutboxItem['entityType'], operation: OutboxItem['operation'], data: any) {
    await db.outbox.add({
      entityType,
      operation,
      data,
      timestamp: Date.now()
    });
    if (this.isOnline) {
      this.processOutbox();
    }
  }

  // --- Implémentation IDataService ---

  subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void {
    const unsub = liveQuery(() => db.outbox.count()).subscribe((count) => {
      callback({
        isOnline: this.isOnline,
        isSyncing: false,
        hasPendingWrites: count > 0,
        lastSyncedAt: new Date()
      });
    });
    return () => unsub.unsubscribe();
  }

  async getItems(): Promise<Item[]> {
    return await db.items.toArray();
  }

  subscribeToItems(callback: (items: Item[]) => void): () => void {
    const observable = liveQuery(() => db.items.toArray());
    const subscription = observable.subscribe({
      next: callback,
      error: console.error
    });
    return () => subscription.unsubscribe();
  }

  async saveItem(item: Omit<Item, 'id'> | Item): Promise<string> {
    const id = 'id' in item ? item.id : Math.random().toString(36).substr(2, 9);
    const finalItem = { ...item, id } as Item;
    await db.items.put(finalItem);
    await this.queueOperation('items', 'update', finalItem);
    return id;
  }

  async removeItem(id: string): Promise<void> {
    await db.items.delete(id);
    await this.queueOperation('items', 'delete', { id });
  }

  async getSales(): Promise<Sale[]> {
    return await db.sales.toArray();
  }

  subscribeToSales(callback: (sales: Sale[]) => void): () => void {
    const observable = liveQuery(() => db.sales.toArray());
    const subscription = observable.subscribe({
      next: callback,
      error: console.error
    });
    return () => subscription.unsubscribe();
  }

  async recordSale(payload: { itemId: string; quantity: number; eventId?: string; saleDate?: Date }): Promise<string> {
    const item = await db.items.get(payload.itemId);
    if (!item) throw new Error('Article non trouvé');

    const saleId = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id: saleId,
      itemId: payload.itemId,
      quantity: payload.quantity,
      salePrice: item.price * payload.quantity,
      timestamp: payload.saleDate || new Date(),
      eventId: payload.eventId
    };

    // Mise à jour locale immédiate
    await db.sales.add(newSale);
    
    // Si c'est une vente directe (pas liée à un événement), déduire du stock central
    if (!payload.eventId) {
      const updatedItem = { ...item, currentQuantity: item.currentQuantity - payload.quantity };
      await db.items.put(updatedItem);
      await this.queueOperation('items', 'update', updatedItem);
    } else {
      // Pour une vente d'événement, on pourrait aussi déduire du stock alloué ici si besoin
    }

    await this.queueOperation('sales', 'create', newSale);
    return saleId;
  }

  async getEvents(): Promise<Event[]> {
    return await db.events.toArray();
  }

  subscribeToEvents(callback: (events: Event[]) => void): () => void {
    const observable = liveQuery(() => db.events.toArray());
    const subscription = observable.subscribe({
      next: callback,
      error: console.error
    });
    return () => subscription.unsubscribe();
  }

  async saveEvent(event: Omit<Event, 'id' | 'date'> & { date: Date } | Event): Promise<string> {
    const id = 'id' in event ? event.id : Math.random().toString(36).substr(2, 9);
    const finalEvent = { ...event, id } as Event;
    await db.events.put(finalEvent);
    await this.queueOperation('events', 'update', finalEvent);
    return id;
  }

  async removeEvent(id: string): Promise<void> {
    await db.events.delete(id);
    await this.queueOperation('events', 'delete', { id });
  }

  async allocateStock(eventId: string, itemId: string, quantity: number): Promise<void> {
    const item = await db.items.get(itemId);
    if (!item || item.currentQuantity < quantity) throw new Error('Stock insuffisant');

    // Mettre à jour l'item (déduire du central)
    const updatedItem = { ...item, currentQuantity: item.currentQuantity - quantity };
    await db.items.put(updatedItem);
    await this.queueOperation('items', 'update', updatedItem);

    // Mettre à jour ou créer le stock d'événement
    const stockId = `${eventId}_${itemId}`;
    const existing = await db.eventStocks.get(stockId);
    let finalStock: EventStock;
    
    if (existing) {
      finalStock = { ...existing, allocatedQuantity: existing.allocatedQuantity + quantity };
    } else {
      finalStock = { id: stockId, eventId, itemId, allocatedQuantity: quantity };
    }
    
    await db.eventStocks.put(finalStock);
    await this.queueOperation('eventStocks', 'update', finalStock);
  }

  async getEventDetails(eventId: string) {
    const [event, stocks, sales] = await Promise.all([
      db.events.get(eventId),
      db.eventStocks.where('eventId').equals(eventId).toArray(),
      db.sales.where('eventId').equals(eventId).toArray()
    ]);
    return { event: event || null, stocks, sales };
  }

  subscribeToEventDetails(eventId: string, callback: (details: any) => void): () => void {
    const observable = liveQuery(async () => {
      return await this.getEventDetails(eventId);
    });
    const subscription = observable.subscribe({
      next: callback,
      error: console.error
    });
    return () => subscription.unsubscribe();
  }
}
