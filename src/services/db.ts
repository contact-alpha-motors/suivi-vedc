import Dexie, { type Table } from 'dexie';
import type { Item, Sale, Event, EventStock } from '@/lib/types';

export interface OutboxItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entityType: 'items' | 'sales' | 'events' | 'eventStocks';
  data: any;
  timestamp: number;
}

export class AppDatabase extends Dexie {
  items!: Table<Item>;
  sales!: Table<Sale>;
  events!: Table<Event>;
  eventStocks!: Table<EventStock>;
  outbox!: Table<OutboxItem>;

  constructor() {
    super('VEDCInventoryDB');
    this.version(1).stores({
      items: 'id, name',
      sales: 'id, itemId, eventId, timestamp',
      events: 'id, date',
      eventStocks: 'id, eventId, itemId',
      outbox: '++id, entityType, operation, timestamp'
    });
  }
}

// Création d'une instance unique. Dexie est safe en SSR tant qu'on n'ouvre pas la DB.
export const db = new AppDatabase();
