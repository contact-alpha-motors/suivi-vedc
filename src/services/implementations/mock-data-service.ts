
import { IDataService, SyncStatus } from '../interfaces/data-service.interface';
import { Item, Sale, Event, EventStock } from '@/lib/types';

export class MockDataService implements IDataService {
  private items: Item[] = [
    { id: '1', name: 'Livre de Cantiques', description: 'Recueil complet', price: 2500, initialQuantity: 100, currentQuantity: 85, lowStockThreshold: 10 },
    { id: '2', name: 'Calendrier 2024', description: 'Thème biblique', price: 1500, initialQuantity: 200, currentQuantity: 150, lowStockThreshold: 20 },
  ];

  private events: Event[] = [
    { id: 'ev1', name: 'Conférence Annuelle', location: 'Yaoundé', date: new Date(), administrator: 'Admin VEDC' },
  ];

  private sales: Sale[] = [];
  private stocks: EventStock[] = [];

  private itemListeners: ((items: Item[]) => void)[] = [];
  private saleListeners: ((sales: Sale[]) => void)[] = [];
  private eventListeners: ((events: Event[]) => void)[] = [];
  private eventDetailListeners: Map<string, ((details: any) => void)[]> = new Map();

  subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void {
    callback({ isOnline: true, isSyncing: false, hasPendingWrites: false, lastSyncedAt: new Date() });
    return () => {};
  }

  async getItems(): Promise<Item[]> { return this.items; }
  subscribeToItems(callback: (items: Item[]) => void): () => void {
    callback(this.items);
    this.itemListeners.push(callback);
    return () => { this.itemListeners = this.itemListeners.filter(l => l !== callback); };
  }

  async saveItem(item: Omit<Item, 'id'> | Item): Promise<string> {
    const id = 'id' in item ? item.id : Math.random().toString(36).substr(2, 9);
    if ('id' in item) {
      this.items = this.items.map(i => i.id === id ? item as Item : i);
    } else {
      this.items.push({ ...item, id } as Item);
    }
    this.notifyItems();
    return id;
  }

  async removeItem(id: string): Promise<void> {
    this.items = this.items.filter(i => i.id !== id);
    this.notifyItems();
  }

  async getSales(): Promise<Sale[]> { return this.sales; }
  subscribeToSales(callback: (sales: Sale[]) => void): () => void {
    callback(this.sales);
    this.saleListeners.push(callback);
    return () => { this.saleListeners = this.saleListeners.filter(l => l !== callback); };
  }

  async recordSale(payload: { itemId: string; quantity: number; eventId?: string; saleDate?: Date }): Promise<string> {
    const item = this.items.find(i => i.id === payload.itemId);
    if (!item) throw new Error('Article non trouvé');

    const id = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id,
      itemId: payload.itemId,
      quantity: payload.quantity,
      salePrice: item.price * payload.quantity,
      timestamp: payload.saleDate || new Date(),
      eventId: payload.eventId
    };

    if (!payload.eventId) {
      item.currentQuantity -= payload.quantity;
    }

    this.sales.push(newSale);
    this.notifySales();
    this.notifyItems();
    if (payload.eventId) this.notifyEventDetails(payload.eventId);
    return id;
  }

  async getEvents(): Promise<Event[]> { return this.events; }
  subscribeToEvents(callback: (events: Event[]) => void): () => void {
    callback(this.events);
    this.eventListeners.push(callback);
    return () => { this.eventListeners = this.eventListeners.filter(l => l !== callback); };
  }

  async saveEvent(event: Omit<Event, 'id' | 'date'> & { date: Date } | Event): Promise<string> {
    const id = 'id' in event ? event.id : Math.random().toString(36).substr(2, 9);
    if ('id' in event) {
      this.events = this.events.map(e => e.id === id ? event as Event : e);
    } else {
      this.events.push({ ...event, id } as Event);
    }
    this.notifyEvents();
    return id;
  }

  async removeEvent(id: string): Promise<void> {
    this.events = this.events.filter(e => e.id !== id);
    this.notifyEvents();
  }

  async allocateStock(eventId: string, itemId: string, quantity: number): Promise<void> {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.currentQuantity < quantity) throw new Error('Stock insuffisant');

    item.currentQuantity -= quantity;
    const stockId = `${eventId}_${itemId}`;
    const existing = this.stocks.find(s => s.id === stockId);
    if (existing) {
      existing.allocatedQuantity += quantity;
    } else {
      this.stocks.push({ id: stockId, eventId, itemId, allocatedQuantity: quantity });
    }
    this.notifyItems();
    this.notifyEventDetails(eventId);
  }

  async getEventDetails(eventId: string) {
    return {
      event: this.events.find(e => e.id === eventId) || null,
      stocks: this.stocks.filter(s => s.eventId === eventId),
      sales: this.sales.filter(s => s.eventId === eventId),
    };
  }

  subscribeToEventDetails(eventId: string, callback: (details: any) => void): () => void {
    this.getEventDetails(eventId).then(callback);
    if (!this.eventDetailListeners.has(eventId)) this.eventDetailListeners.set(eventId, []);
    this.eventDetailListeners.get(eventId)!.push(callback);
    return () => {
      const listeners = this.eventDetailListeners.get(eventId) || [];
      this.eventDetailListeners.set(eventId, listeners.filter(l => l !== callback));
    };
  }

  private notifyItems() { this.itemListeners.forEach(l => l([...this.items])); }
  private notifySales() { this.saleListeners.forEach(l => l([...this.sales])); }
  private notifyEvents() { this.eventListeners.forEach(l => l([...this.events])); }
  private notifyEventDetails(eventId: string) {
    this.getEventDetails(eventId).then(details => {
      this.eventDetailListeners.get(eventId)?.forEach(l => l(details));
    });
  }
}
