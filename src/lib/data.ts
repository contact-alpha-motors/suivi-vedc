'use client';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  Timestamp,
  documentId,
  getFirestore
} from 'firebase/firestore';
import type { Item, Sale, Event, EventStock, SaleWithISOString, EventWithISOString } from './types';
import { initializeFirebase } from '@/firebase';

const { firestore: db } = initializeFirebase();

const itemsCollection = collection(db, 'inventoryItems');
const salesCollection = collection(db, 'sales');
const eventsCollection = collection(db, 'events');
const eventStocksCollection = collection(db, 'eventStocks');

const fromFirestore = <T extends { timestamp?: Timestamp; date?: Timestamp }>(doc: any): T => {
    const data = doc.data();
    const result: any = { ...data, id: doc.id };
    if (data.timestamp && data.timestamp instanceof Timestamp) {
      result.timestamp = data.timestamp.toDate().toISOString();
    }
    if (data.date && data.date instanceof Timestamp) {
      result.date = data.date.toDate().toISOString();
    }
    return result as T;
};

// --- Item Functions ---
export const getItems = async (): Promise<Item[]> => {
  const snapshot = await getDocs(itemsCollection);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Item));
};

export const getItem = async (id: string): Promise<Item | undefined> => {
  const docRef = doc(db, 'inventoryItems', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Item : undefined;
};

export const addItem = async (item: Omit<Item, 'id'>): Promise<Item> => {
  const docRef = await addDoc(itemsCollection, item);
  return { ...item, id: docRef.id };
};

export const updateItem = async (updatedItem: Item): Promise<Item> => {
  const docRef = doc(db, 'inventoryItems', updatedItem.id);
  await updateDoc(docRef, { ...updatedItem });
  return updatedItem;
};

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  const docRef = doc(db, 'inventoryItems', id);
  await deleteDoc(docRef);
  return { success: true };
};


// --- Sale Functions ---
export const getSales = async (): Promise<SaleWithISOString[]> => {
  const snapshot = await getDocs(query(salesCollection));
  return snapshot.docs.map(doc => fromFirestore<SaleWithISOString>(doc));
};

export const getSalesForEvent = async (eventId: string): Promise<SaleWithISOString[]> => {
  const q = query(salesCollection, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<SaleWithISOString>(doc));
};

type AddSalePayload = {
  itemId: string;
  quantity: number;
  saleDate?: string;
  eventId?: string;
};

export const addSale = async (sale: AddSalePayload): Promise<SaleWithISOString> => {
  const item = await getItem(sale.itemId);
  if (!item) throw new Error('Item not found');

  const batch = writeBatch(db);

  if (sale.eventId) {
    const eventStockRef = doc(db, 'eventStocks', `${sale.eventId}_${sale.itemId}`);
    const eventStockSnap = await getDoc(eventStockRef);
    
    const eventStockData = eventStockSnap.data() as EventStock | undefined;

    const salesSnapshot = await getDocs(query(salesCollection, where('eventId', '==', sale.eventId), where('itemId', '==', sale.itemId)));
    const salesForEventItem = salesSnapshot.docs.map(d => d.data() as Sale).reduce((sum, s) => sum + s.quantity, 0);

    const eventStockAvailable = (eventStockData?.allocatedQuantity || 0) - salesForEventItem;

    if (eventStockAvailable < sale.quantity) {
      throw new Error(`Stock d'événement insuffisant pour ${item.name}. Restant: ${eventStockAvailable}`);
    }
    // No change to central stock when it's an event sale
  } else {
    if (item.currentQuantity < sale.quantity) {
      throw new Error(`Stock central insuffisant pour ${item.name}`);
    }
    const itemRef = doc(db, 'inventoryItems', item.id);
    batch.update(itemRef, { currentQuantity: item.currentQuantity - sale.quantity });
  }

  let saleTimestamp: Timestamp;
  if (sale.saleDate) {
      const date = new Date(sale.saleDate);
      const now = new Date();
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(now.getSeconds());
      saleTimestamp = Timestamp.fromDate(date);
  } else {
      saleTimestamp = Timestamp.now();
  }

  const newSaleData = {
    itemId: sale.itemId,
    quantity: sale.quantity,
    salePrice: item.price * sale.quantity,
    timestamp: saleTimestamp,
    eventId: sale.eventId || null,
  };

  const saleDocRef = doc(collection(db, 'sales'));
  batch.set(saleDocRef, newSaleData);

  await batch.commit();

  return { 
    ...newSaleData, 
    id: saleDocRef.id, 
    timestamp: newSaleData.timestamp.toDate().toISOString() 
  };
};

// --- Event Functions ---
export const getEvents = async (): Promise<EventWithISOString[]> => {
  const snapshot = await getDocs(eventsCollection);
  return snapshot.docs.map(doc => fromFirestore<EventWithISOString>(doc));
};

export const getEvent = async (id: string): Promise<EventWithISOString | undefined> => {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? fromFirestore<EventWithISOString>(docSnap) : undefined;
};

export const addEvent = async (event: Omit<Event, 'id' | 'date'> & { date: Date }): Promise<EventWithISOString> => {
  const newEventData = {
    ...event,
    date: Timestamp.fromDate(event.date),
  };
  const docRef = await addDoc(eventsCollection, newEventData);
  return { ...event, id: docRef.id, date: event.date.toISOString() };
};

export const updateEvent = async (updatedEventData: Omit<Event, 'date'> & { date: Date }): Promise<EventWithISOString> => {
  const docRef = doc(db, 'events', updatedEventData.id);
  const dataToUpdate = {
    ...updatedEventData,
    date: Timestamp.fromDate(updatedEventData.date),
  };
  await updateDoc(docRef, dataToUpdate);
  return { ...updatedEventData, date: updatedEventData.date.toISOString() };
};

export const deleteEvent = async (id: string): Promise<{ success: boolean }> => {
  const docRef = doc(db, 'events', id);
  await deleteDoc(docRef);
  // Also delete associated event stocks
  const q = query(eventStocksCollection, where('eventId', '==', id));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return { success: true };
};

// --- EventStock Functions ---
export const getEventStocks = async (eventId: string): Promise<EventStock[]> => {
  const q = query(eventStocksCollection, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as EventStock));
};

export const allocateStockToEvent = async (eventId: string, itemId: string, quantity: number): Promise<EventStock> => {
  const item = await getItem(itemId);
  if (!item) throw new Error("Article non trouvé.");
  if (item.currentQuantity < quantity) throw new Error("Stock central insuffisant.");

  const batch = writeBatch(db);
  const itemRef = doc(db, 'inventoryItems', itemId);
  batch.update(itemRef, { currentQuantity: item.currentQuantity - quantity });
  
  const eventStockId = `${eventId}_${itemId}`;
  const eventStockRef = doc(db, 'eventStocks', eventStockId);
  const eventStockSnap = await getDoc(eventStockRef);

  let finalEventStock: EventStock;

  if (eventStockSnap.exists()) {
    const currentStock = eventStockSnap.data() as EventStock;
    const newQuantity = currentStock.allocatedQuantity + quantity;
    batch.update(eventStockRef, { allocatedQuantity: newQuantity });
    finalEventStock = { ...currentStock, allocatedQuantity: newQuantity };
  } else {
    const newStock: EventStock = { id: eventStockId, eventId, itemId, allocatedQuantity: quantity };
    batch.set(eventStockRef, { eventId, itemId, allocatedQuantity: quantity });
    finalEventStock = newStock;
  }

  await batch.commit();
  return finalEventStock;
};
