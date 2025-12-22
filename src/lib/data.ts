import type { Item, Sale, Event } from './types';

// Simulate a database
let items: Item[] = [
  { id: '1', name: 'Livre "VEDC"', description: 'Le livre principal de la collection.', price: 15.00, initialQuantity: 100, currentQuantity: 75, lowStockThreshold: 10 },
  { id: '2', name: 'Calendrier 2024', description: 'Calendrier annuel avec illustrations.', price: 10.00, initialQuantity: 200, currentQuantity: 150, lowStockThreshold: 20 },
  { id: '3', name: 'Affiche "Espoir"', description: 'Affiche décorative format A3.', price: 5.00, initialQuantity: 50, currentQuantity: 4, lowStockThreshold: 5 },
  { id: '4', name: 'T-shirt Logo', description: 'T-shirt en coton bio avec le logo VEDC.', price: 25.00, initialQuantity: 75, currentQuantity: 60, lowStockThreshold: 10 },
  { id: '5', name: 'Mug VEDC', description: 'Mug en céramique.', price: 12.00, initialQuantity: 40, currentQuantity: 40, lowStockThreshold: 5 },
];

let sales: Sale[] = [
    { id: 's1', itemId: '1', quantity: 2, salePrice: 30.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 2)) },
    { id: 's2', itemId: '2', quantity: 5, salePrice: 50.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 2)) },
    { id: 's3', itemId: '1', quantity: 1, salePrice: 15.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 's4', itemId: '3', quantity: 3, salePrice: 15.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 's5', itemId: '4', quantity: 1, salePrice: 25.00, timestamp: new Date() },
    { id: 's6', itemId: '2', quantity: 10, salePrice: 100.00, timestamp: new Date() },
];

let events: Event[] = [
    { id: 'e1', name: 'Vente Anuelle', location: 'Paris', date: new Date('2024-09-15T09:00:00'), administrator: 'Jean Dupont' },
    { id: 'e2', name: 'Festival du Livre', location: 'Lyon', date: new Date('2024-10-20T10:00:00'), administrator: 'Marie Curie' },
    { id: 'e3', name: 'Marché de Noël', location: 'Strasbourg', date: new Date('2024-12-05T09:00:00'), administrator: 'Pierre Martin' },
];

// Simulate API calls
export const getItems = async (): Promise<Item[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return items;
};

export const getItem = async (id: string): Promise<Item | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return items.find(item => item.id === id);
}

export const getSales = async (): Promise<Sale[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return sales.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getEvents = async (): Promise<Event[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return events;
}

// These functions simulate mutations and would be replaced by API calls or offline storage logic
export const addItem = async (item: Omit<Item, 'id'>): Promise<Item> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newItem: Item = { ...item, id: String(Date.now()) };
    items.push(newItem);
    return newItem;
}

export const updateItem = async (updatedItem: Item): Promise<Item> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    items = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    return updatedItem;
}

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    items = items.filter(item => item.id !== id);
    return { success: true };
}

export const addSale = async (sale: Omit<Sale, 'id' | 'timestamp' | 'salePrice'>): Promise<Sale> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const item = await getItem(sale.itemId);
    if (!item) throw new Error('Item not found');

    if (item.currentQuantity < sale.quantity) throw new Error('Not enough stock');
    
    const newSale: Sale = { 
        ...sale, 
        id: String(Date.now()), 
        timestamp: new Date(),
        salePrice: item.price * sale.quantity,
    };
    
    sales.unshift(newSale); // Add to beginning of array
    item.currentQuantity -= sale.quantity;
    await updateItem(item);

    return newSale;
}

export const addEvent = async (event: Omit<Event, 'id'>): Promise<Event> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newEvent: Event = { ...event, id: String(Date.now()) };
    events.push(newEvent);
    return newEvent;
}

export const updateEvent = async (updatedEvent: Event): Promise<Event> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    events = events.map(event => event.id === updatedEvent.id ? updatedEvent : event);
    return updatedEvent;
}

export const deleteEvent = async (id: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    events = events.filter(event => event.id !== id);
    return { success: true };
}
