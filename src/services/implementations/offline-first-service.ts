
'use client';

import { IDataService, SyncStatus } from '../interfaces/data-service.interface';
import { IApiProvider } from '../interfaces/api-provider.interface';
import { Item, Sale, Event, EventStock } from '@/lib/types';
import { db, OutboxItem } from '../db';
import { liveQuery } from 'dexie';

/**
 * Service gérant la logique "Offline First".
 * Il utilise Dexie pour le stockage local immédiat et un IApiProvider pour la synchronisation.
 */
export class OfflineFirstService implements IDataService {
  private apiProvider: IApiProvider;
  private isOnline: boolean = true;
  private syncInterval: any = null;

  constructor(apiProvider: IApiProvider) {
    this.apiProvider = apiProvider;
    this.setupConnectivityListener();
    this.startBackgroundSync();
  }

  private setupConnectivityListener() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOutbox();
        this.syncWithRemote();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Lance une synchronisation périodique du distant vers le local.
   */
  private startBackgroundSync() {
    // Sync initiale
    this.syncWithRemote();
    // Sync toutes les 60 secondes si en ligne
    this.syncInterval = setInterval(() => {
      if (this.isOnline) this.syncWithRemote();
    }, 60000);
  }

  /**
   * Récupère les données distantes pour mettre à jour le cache local.
   */
  private async syncWithRemote() {
    if (!this.isOnline) return;

    try {
      const [items, events, sales, eventStocks] = await Promise.all([
        this.apiProvider.fetchItems(),
        this.apiProvider.fetchEvents(),
        this.apiProvider.fetchSales(),
        this.apiProvider.fetchEventStocks()
      ]);

      // Mise à jour atomique du cache local (Dexie)
      await db.transaction('rw', db.items, db.events, db.sales, db.eventStocks, async () => {
        await db.items.bulkPut(items);
        await db.events.bulkPut(events);
        await db.sales.bulkPut(sales);
        await db.eventStocks.bulkPut(eventStocks);
      });
    } catch (e) {
      console.error('Erreur lors de la synchronisation distante:', e);
    }
  }

  /**
   * Envoie les modifications locales (Outbox) vers le distant.
   */
  private async processOutbox() {
    const pending = await db.outbox.orderBy('timestamp').toArray();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        if (item.operation === 'delete') {
          if (item.entityType === 'items') await this.apiProvider.removeItem(item.data.id);
          else if (item.entityType === 'events') await this.apiProvider.removeEvent(item.data.id);
        } else {
          if (item.entityType === 'items') await this.apiProvider.saveItem(item.data);
          else if (item.entityType === 'events') await this.apiProvider.saveEvent(item.data);
          else if (item.entityType === 'sales') await this.apiProvider.recordSale(item.data);
          else if (item.entityType === 'eventStocks') await this.apiProvider.saveEventStock(item.data);
        }
        await db.outbox.delete(item.id!);
      } catch (e) {
        console.error('Erreur de synchronisation Outbox:', e);
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

  // --- Implémentation IDataService (Consommée par l'UI) ---

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
    const subscription = observable.subscribe({ next: callback });
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
    const subscription = observable.subscribe({ next: callback });
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

    await db.sales.add(newSale);
    
    if (!payload.eventId) {
      const updatedItem = { ...item, currentQuantity: item.currentQuantity - payload.quantity };
      await db.items.put(updatedItem);
      await this.queueOperation('items', 'update', updatedItem);
    }

    await this.queueOperation('sales', 'create', newSale);
    return saleId;
  }

  async getEvents(): Promise<Event[]> {
    return await db.events.toArray();
  }

  subscribeToEvents(callback: (events: Event[]) => void): () => void {
    const observable = liveQuery(() => db.events.toArray());
    const subscription = observable.subscribe({ next: callback });
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

    const updatedItem = { ...item, currentQuantity: item.currentQuantity - quantity };
    await db.items.put(updatedItem);
    await this.queueOperation('items', 'update', updatedItem);

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
    const subscription = observable.subscribe({ next: callback });
    return () => subscription.unsubscribe();
  }
}
