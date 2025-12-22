import type { Item, Sale, Event, EventStock } from './types';

// Simulate a database
let items: Item[] = [
  { id: '1', name: 'Livre "VEDC"', description: 'Le livre principal de la collection.', price: 15.00, initialQuantity: 100, currentQuantity: 75, lowStockThreshold: 10 },
  { id: '2', name: 'Calendrier 2024', description: 'Calendrier annuel avec illustrations.', price: 10.00, initialQuantity: 200, currentQuantity: 150, lowStockThreshold: 20 },
  { id: '3', name: 'Affiche "Espoir"', description: 'Affiche décorative format A3.', price: 5.00, initialQuantity: 50, currentQuantity: 4, lowStockThreshold: 5 },
  { id: '4', name: 'T-shirt Logo', description: 'T-shirt en coton bio avec le logo VEDC.', price: 25.00, initialQuantity: 75, currentQuantity: 60, lowStockThreshold: 10 },
  { id: '5', name: 'Mug VEDC', description: 'Mug en céramique.', price: 12.00, initialQuantity: 40, currentQuantity: 40, lowStockThreshold: 5 },
];

let sales: Omit<Sale, 'timestamp'> & { timestamp: Date }[] = [
    { id: 's1', itemId: '1', quantity: 2, salePrice: 30.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 2)), eventId: 'e1' },
    { id: 's2', itemId: '2', quantity: 5, salePrice: 50.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 2)), eventId: 'e1' },
    { id: 's3', itemId: '1', quantity: 1, salePrice: 15.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 's4', itemId: '3', quantity: 3, salePrice: 15.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), eventId: 'e2' },
    { id: 's5', itemId: '4', quantity: 1, salePrice: 25.00, timestamp: new Date() },
    { id: 's6', itemId: '2', quantity: 10, salePrice: 100.00, timestamp: new Date(), eventId: 'e2' },
];

let events: Omit<Event, 'date'> & { date: Date }[] = [
    { id: 'e1', name: 'Vente Anuelle', location: 'Paris', date: new Date('2024-09-15T09:00:00'), administrator: 'Jean Dupont' },
    { id: 'e2', name: 'Festival du Livre', location: 'Lyon', date: new Date('2024-10-20T10:00:00'), administrator: 'Marie Curie' },
    { id: 'e3', name: 'Marché de Noël', location: 'Strasbourg', date: new Date('2024-12-05T09:00:00'), administrator: 'Pierre Martin' },
];

let eventStocks: EventStock[] = [
    { eventId: 'e1', itemId: '1', allocatedQuantity: 20 },
    { eventId: 'e1', itemId: '2', allocatedQuantity: 30 },
    { eventId: 'e2', itemId: '1', allocatedQuantity: 10 },
    { eventId: 'e2', itemId: '2', allocatedQuantity: 50 },
    { eventId: 'e2', itemId: '3', allocatedQuantity: 10 },
];

const toJSON = <T extends { timestamp?: Date; date?: Date }>(obj: T) => {
    const newObj = { ...obj };
    if (newObj.timestamp) {
        (newObj as any).timestamp = newObj.timestamp.toISOString();
    }
    if (newObj.date) {
        (newObj as any).date = newObj.date.toISOString();
    }
    return newObj;
};

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
  return sales.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(toJSON) as Sale[];
};

export const getSalesForEvent = async(eventId: string): Promise<Sale[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return sales.filter(s => s.eventId === eventId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(toJSON) as Sale[];
}

export const getEvents = async (): Promise<Event[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return events.map(toJSON) as Event[];
}

export const getEvent = async (id: string): Promise<Event | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const event = events.find(event => event.id === id);
    return event ? toJSON(event) as Event : undefined;
}

export const getEventStocks = async (eventId: string): Promise<EventStock[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return eventStocks.filter(es => es.eventId === eventId);
};

export const allocateStockToEvent = async (eventId: string, itemId: string, quantity: number): Promise<EventStock> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error("Article non trouvé.");
    if (item.currentQuantity < quantity) throw new Error("Stock central insuffisant.");

    item.currentQuantity -= quantity;
    
    let eventStock = eventStocks.find(es => es.eventId === eventId && es.itemId === itemId);
    if (eventStock) {
        eventStock.allocatedQuantity += quantity;
    } else {
        eventStock = { eventId, itemId, allocatedQuantity: quantity };
        eventStocks.push(eventStock);
    }
    
    // Simulate updating the central item stock
    await updateItem(item);

    return { ...eventStock };
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

type AddSalePayload = {
    itemId: string;
    quantity: number;
    saleDate?: string;
    eventId?: string;
};

export const addSale = async (sale: AddSalePayload): Promise<Sale> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Quicker for bulk
    const item = await getItem(sale.itemId);
    if (!item) throw new Error('Item not found');

    if (sale.eventId) {
        const eventStock = eventStocks.find(es => es.eventId === sale.eventId && es.itemId === sale.itemId);
        const salesForEventItem = sales.filter(s => s.eventId === sale.eventId && s.itemId === sale.itemId).reduce((sum, s) => sum + s.quantity, 0);
        const eventStockAvailable = (eventStock?.allocatedQuantity || 0) - salesForEventItem;
        if (eventStockAvailable < sale.quantity) throw new Error(`Stock d'événement insuffisant pour ${item.name}. Restant: ${eventStockAvailable}`);
    } else {
        if (item.currentQuantity < sale.quantity) throw new Error(`Stock central insuffisant pour ${item.name}`);
        item.currentQuantity -= sale.quantity; // Deduct from central stock only if no event
        await updateItem(item);
    }
    
    const timestamp = sale.saleDate ? new Date(sale.saleDate) : new Date();
    // make sure timestamp also includes current time
    if (sale.saleDate) {
        timestamp.setHours(new Date().getHours());
        timestamp.setMinutes(new Date().getMinutes());
        timestamp.setSeconds(new Date().getSeconds());
    }


    const newSaleData = { 
        itemId: sale.itemId,
        quantity: sale.quantity,
        id: `${Date.now()}-${Math.random()}`, 
        timestamp: timestamp,
        salePrice: item.price * sale.quantity,
        eventId: sale.eventId,
    };
    
    sales.unshift(newSaleData); // Add to beginning of array

    return toJSON(newSaleData) as Sale;
}

export const addEvent = async (event: Omit<Event, 'id' | 'date'> & {date: Date}): Promise<Event> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newEventData = { ...event, id: String(Date.now()) };
    events.push(newEventData);
    return toJSON(newEventData) as Event;
}

export const updateEvent = async (updatedEventData: Omit<Event, 'date'> & {date: Date}): Promise<Event> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    events = events.map(event => event.id === updatedEventData.id ? updatedEventData : event);
    return toJSON(updatedEventData) as Event;
}

export const deleteEvent = async (id: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    events = events.filter(event => event.id !== id);
    return { success: true };
}
