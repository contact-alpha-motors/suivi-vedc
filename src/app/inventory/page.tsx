import InventoryClient from '@/components/inventory/inventory-client';
import { getItems } from '@/lib/data';

export default async function InventoryPage() {
  const initialItems = await getItems();
  return <InventoryClient initialItems={initialItems} />;
}
