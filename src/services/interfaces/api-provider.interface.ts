
import { Item, Sale, Event, EventStock } from '@/lib/types';

/**
 * Interface définissant les capacités requises pour un fournisseur de données distant (Backend).
 * Cette interface est agnostique de la technologie utilisée (Firebase, Flask, Supabase, etc.).
 */
export interface IApiProvider {
  // Articles
  fetchItems(): Promise<Item[]>;
  saveItem(item: Item): Promise<void>;
  removeItem(id: string): Promise<void>;

  // Événements
  fetchEvents(): Promise<Event[]>;
  saveEvent(event: Event): Promise<void>;
  removeEvent(id: string): Promise<void>;

  // Ventes
  fetchSales(): Promise<Sale[]>;
  recordSale(sale: Sale): Promise<void>;

  // Stocks d'événements
  fetchEventStocks(): Promise<EventStock[]>;
  saveEventStock(stock: EventStock): Promise<void>;
}
