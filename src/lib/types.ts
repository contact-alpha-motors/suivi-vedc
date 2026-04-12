
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  initialQuantity: number;
  currentQuantity: number;
  lowStockThreshold: number;
}

export interface EventStock {
  id: string;
  eventId: string;
  itemId: string;
  allocatedQuantity: number;
}

export interface Sale {
  id: string;
  itemId: string;
  quantity: number;
  salePrice: number;
  timestamp: Date;
  eventId?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: Date;
  administrator: string;
}
