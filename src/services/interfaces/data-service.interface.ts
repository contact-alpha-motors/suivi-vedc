
import { Item, Sale, Event, EventStock } from '@/lib/types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  hasPendingWrites: boolean;
  lastSyncedAt: Date | null;
}

export interface IDataService {
  // --- ÉTAT DE SYNCHRONISATION ---
  subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void;

  // --- ARTICLES (INVENTAIRE) ---
  getItems(): Promise<Item[]>;
  subscribeToItems(callback: (items: Item[]) => void): () => void;
  saveItem(item: Omit<Item, 'id'> | Item): Promise<string>;
  removeItem(id: string): Promise<void>;

  // --- VENTES ---
  getSales(): Promise<Sale[]>;
  subscribeToSales(callback: (sales: Sale[]) => void): () => void;
  recordSale(payload: { 
    itemId: string; 
    quantity: number; 
    eventId?: string; 
    saleDate?: Date 
  }): Promise<string>;

  // --- ÉVÉNEMENTS ---
  getEvents(): Promise<Event[]>;
  subscribeToEvents(callback: (events: Event[]) => void): () => void;
  saveEvent(event: Omit<Event, 'id' | 'date'> & { date: Date } | Event): Promise<string>;
  removeEvent(id: string): Promise<void>;
  allocateStock(eventId: string, itemId: string, quantity: number): Promise<void>;

  // --- DÉTAILS ÉVÉNEMENT ---
  getEventDetails(eventId: string): Promise<{
    event: Event | null;
    stocks: EventStock[];
    sales: Sale[];
  }>;
  subscribeToEventDetails(eventId: string, callback: (details: {
    event: Event | null;
    stocks: EventStock[];
    sales: Sale[];
  }) => void): () => void;
}
