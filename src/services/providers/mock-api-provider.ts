
import { IApiProvider } from '../interfaces/api-provider.interface';
import { Item, Sale, Event, EventStock } from '@/lib/types';

/**
 * Implémentation Mock de l'API distante.
 * Simule des délais réseau et stocke les données en mémoire vive.
 */
export class MockApiProvider implements IApiProvider {
  private items: Item[] = [
    { id: '1', name: 'Livre de Cantiques (Mock)', description: 'Recueil complet', price: 2500, initialQuantity: 100, currentQuantity: 85, lowStockThreshold: 10 },
  ];
  private events: Event[] = [];
  private sales: Sale[] = [];
  private eventStocks: EventStock[] = [];

  private async simulateNetwork() {
    return new Promise(resolve => setTimeout(resolve, 800)); // Simule 800ms de latence
  }

  async fetchItems(): Promise<Item[]> {
    await this.simulateNetwork();
    return [...this.items];
  }

  async saveItem(item: Item): Promise<void> {
    await this.simulateNetwork();
    const index = this.items.findIndex(i => i.id === item.id);
    if (index >= 0) this.items[index] = item;
    else this.items.push(item);
  }

  async removeItem(id: string): Promise<void> {
    await this.simulateNetwork();
    this.items = this.items.filter(i => i.id !== id);
  }

  async fetchEvents(): Promise<Event[]> {
    await this.simulateNetwork();
    return [...this.events];
  }

  async saveEvent(event: Event): Promise<void> {
    await this.simulateNetwork();
    const index = this.events.findIndex(e => e.id === event.id);
    if (index >= 0) this.events[index] = event;
    else this.events.push(event);
  }

  async removeEvent(id: string): Promise<void> {
    await this.simulateNetwork();
    this.events = this.events.filter(e => e.id !== id);
  }

  async fetchSales(): Promise<Sale[]> {
    await this.simulateNetwork();
    return [...this.sales];
  }

  async recordSale(sale: Sale): Promise<void> {
    await this.simulateNetwork();
    this.sales.push(sale);
  }

  async fetchEventStocks(): Promise<EventStock[]> {
    await this.simulateNetwork();
    return [...this.eventStocks];
  }

  async saveEventStock(stock: EventStock): Promise<void> {
    await this.simulateNetwork();
    const index = this.eventStocks.findIndex(s => s.id === stock.id);
    if (index >= 0) this.eventStocks[index] = stock;
    else this.eventStocks.push(stock);
  }
}
