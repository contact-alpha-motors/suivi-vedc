export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  initialQuantity: number;
  currentQuantity: number;
  lowStockThreshold: number;
}

export interface Sale {
  id: string;
  itemId: string;
  quantity: number;
  salePrice: number; // price at time of sale * quantity
  timestamp: Date;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: Date;
  administrator: string;
}
