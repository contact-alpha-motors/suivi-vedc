import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  initialQuantity: number;
  currentQuantity: number; // This is now central stock
  lowStockThreshold: number;
}

export interface EventStock {
  id: string; // Composite key `${eventId}_${itemId}` in Firestore
  eventId: string;
  itemId: string;
  allocatedQuantity: number;
}

export interface Sale {
  id: string;
  itemId: string;
  quantity: number;
  salePrice: number; // price at time of sale * quantity
  timestamp: Timestamp;
  eventId?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: Timestamp;
  administrator: string;
}
