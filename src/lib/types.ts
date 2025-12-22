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
  eventId: string;
  itemId: string;
  allocatedQuantity: number;
}

export interface Sale {
  id: string;
  itemId: string;
  quantity: number;
  salePrice: number; // price at time of sale * quantity
  timestamp: string; // ISO 8601 string
  eventId?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string; // ISO 8601 string
  administrator: string;
}
